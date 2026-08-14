# REDCOURIER
A lightweight and interactive file transfer command generator designed to streamline asset ingestion and data exfiltration workflows during network security assessments.

## Why to use
During a penetration test, a Red Team engagement, exams (e.g. OSCP, OSEP, PNPT, etc), or even during your CTF, transferring files between an attacker platform (like Kali Linux) and a target machine is a recurring requirement. Security professionals often face different operating systems, restricted firewalls, or environments without administrative access. 

This tool helps by:
- Instantly generating precise, multi-step command sequences for both file ingestion (downloads) and exfiltration (uploads).
- Reducing syntax mistakes when piping raw data streams over encrypted connections.
- Providing a visual flow map that dynamically adjusts based on the selected source and destination parameters. Perhaps this is useful as screenshot to explain what you did in a report.
- Supporting modern, native system features like the built-in Windows OpenSSH capabilities to minimize the footprint on a target system.

## How to use
1. Deploy the application: Open the index.html file inside any modern web browser.
2. Select the direction: Use the top slider tabs to select either Ingestion (Attacker to Victim) or Exfiltration (Victim to Attacker).
3. Configure the endpoints: 
   - Select the operating system for both the Attacker and the Victim.
   - Provide the correct infrastructure IP addresses and define the filename of the target asset.
4. Choose your technique: Pick the desired transfer protocol (such as SSH, SMB, HTTP, or Netcat) from the dropdown list. The tool automatically loads optimal default ports and contextual sub-methods.
5. Execute step by step: Follow the generated command blocks sequentially. Use the integrated copy buttons to copy commands directly into your active terminals.
6. Debug anytime: If something unexpected occurs, press F12, go to the console, and type debugApp() to generate an instant plaintext diagnostics log. This can be used for reporting as well.

## Support and development
This project is open for community contributions and further expansion. Because network protocols, configurations, techniques and operating system updates change frequently, some combinations or templates might not always function flawlessly in every specific edge case. 

If you notice a command string failing during an engagement, or if you want to help expand the database with new ingestion and exfiltration bypasses, you are highly encouraged to submit a pull request or open an issue.

## Credits and inspiration
The concept and design of this application are heavily inspired by the following excellent resources within the cybersecurity community:
- The interactive layout and structure philosophy of [revshells.com](https://www.revshells.com/). No the UI is not the same, but I did like the idea of generating commands.
- The comprehensive file transfer mindmap (Obsidian canvas/mindmaps) created by myself (eMVee), which is publicly available on my [GitHub](https://github.com/eMVee-NL/MindMap#mindmap-transfer-files-from-victim-to-attacker).

## Disclaimer
This software is developed strictly for educational purposes, defensive security research, and authorized penetration testing assignments. It should only be used in networks where you have explicit, written permission from the asset owner.

The author assumes absolutely no liability for any damage, data loss, or legal consequences caused by misuse or unauthorized application of the generated commands. Any illegal or unethical activities conducted with this framework are entirely the responsibility of the user.
