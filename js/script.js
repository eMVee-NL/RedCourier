/**
 * REDCOURIER — Core UI Logic Engine v10
 * Populates the main technique dropdown based on target OS and active direction matrix.
 */
function populateMainTechDropdown() {
    const targetOS = document.getElementById("targetOS").value;
    const mainTechSelect = document.getElementById("mainTech");
    const uniqueTechs = [];
    
    if (!mainTechSelect) return;

    // Cache the previous selection to keep user preference intact if possible
    const previouslySelectedTech = mainTechSelect.value;

    transferDatabase.forEach(item => {
        // MATCHING RULES v10: Verify OS compatibility and direction alignment
        if ((item.os === targetOS || item.os === "any") && item.direction === currentDirection) {
            if (!uniqueTechs.includes(item.tech)) {
                uniqueTechs.push(item.tech);
            }
        }
    });

    mainTechSelect.innerHTML = "";
    uniqueTechs.forEach(tech => {
        const option = document.createElement("option");
        option.value = tech; 
        option.text = tech;
        mainTechSelect.appendChild(option);
    });

    // Restore user selection safely if it is still valid within the newly computed direction matrix
    if (previouslySelectedTech && uniqueTechs.includes(previouslySelectedTech)) {
        mainTechSelect.value = previouslySelectedTech;
    }

    onMainTechChange();
}
/**
 * Filters and populates the sub-method tools matrix dropdown.
 * Syncs seamlessly with the new highest-level direction database model.
 */
function onMainTechChange() {
    const targetOS = document.getElementById("targetOS").value;
    const sourceOS = document.getElementById("sourceOS") ? document.getElementById("sourceOS").value : "linux";
    const selectedTech = document.getElementById("mainTech").value;
    const subMethodSelect = document.getElementById("subMethod");

    if (!selectedTech || !subMethodSelect) return;

    // Cache the previous selection to keep user selection stable
    const previouslySelectedSub = subMethodSelect.value;

    subMethodSelect.innerHTML = "";
    transferDatabase.forEach(item => {
        // Enforce strict matching on tech, direction, and OS parameters
        if (item.tech === selectedTech && item.direction === currentDirection && (item.os === targetOS || item.os === "any")) {
            // Context filtering based on attacker environment setup
            if (selectedTech === "SMB") {
                if (sourceOS === "windows" && (item.id === "smb_windows" || item.id === "smb_windows_native_share_linux_host_exfil")) {
                    return; // Skip Linux-dependent templates if attacker host is Windows
                }
                if (sourceOS === "linux" && item.id === "smb_windows_native_share_win_host_exfil") {
                    return; // Skip Windows-to-Windows pivot templates if attacker host is Linux
                }
            }
            
            const option = document.createElement("option");
            option.value = item.id; 
            option.text = item.name;
            subMethodSelect.appendChild(option);
        }
    });
    // Restore previous selection if valid, or fall back to logical defaults for SMB
    if (previouslySelectedSub && Array.from(subMethodSelect.options).some(opt => opt.value === previouslySelectedSub)) {
        subMethodSelect.value = previouslySelectedSub;
    } else if (selectedTech === "SMB") {
        if (sourceOS === "windows") {
            subMethodSelect.value = "smb_windows_native_share_win_host_exfil";
        } else {
            if (currentDirection === "exfil") {
                subMethodSelect.value = "smb_windows_native_share_linux_host_exfil";
            } else {
                subMethodSelect.value = "smb_windows";
            }
        }
    }

    renderDynamicHostPanel(selectedTech);
}
/**
 * Configures the visibility and contents of attacker daemon panels.
 * Adapts to role flips required during active data exfiltration steps.
 * @param {string} tech - The selected main protocol technique.
 */
function renderDynamicHostPanel(tech) {
    const hostMethodSelect = document.getElementById("hostMethod");
    const portGroupAttacker = document.getElementById("portGroup");
    const portInputAttacker = document.getElementById("hostPort");
    
    const subMethodSelect = document.getElementById("subMethod");
    const victimPortGroup = document.getElementById("victimPortGroup");
    const victimPortInput = document.getElementById("victimPort");

    // Enforce safety resets to shield the DOM from blocking runtime failures
    if (portGroupAttacker) portGroupAttacker.style.display = "block";
    if (victimPortGroup) victimPortGroup.style.display = "none"; 
    if (subMethodSelect && subMethodSelect.parentElement) subMethodSelect.parentElement.style.display = "block";
    // 1. POPULATE THE ATTACKER DAEMON DROPDOWN BASED ON DIRECTION CONTEXT
    if (hostMethodSelect) {
        hostMethodSelect.innerHTML = "";
        const sourceOS = document.getElementById("sourceOS") ? document.getElementById("sourceOS").value : "linux";
        const selectedSubId = subMethodSelect ? subMethodSelect.value : "";
        
        // Handle standalone server elimination for target-hosted administrative shares
        if (tech === "SMB" && currentDirection === "exfil") {
            if (selectedSubId === "smb_windows_native_share_linux_host_exfil" || selectedSubId === "smb_windows_native_share_win_host_exfil") {
                hostMethodSelect.innerHTML = `<option value="none">No standalone server required</option>`;
                if (portGroupAttacker) portGroupAttacker.style.display = "none";
            } else {
                hostMethodSelect.innerHTML = `<option value="impacket">Impacket SMB Server Suite (Linux Host)</option>`;
            }
        } else {
            // General multi-protocol selection matching with strict OS alignment
            const availableHosts = hostingDatabase.filter(h => h.tech === tech);
            
            if (availableHosts.length === 0) {
                hostMethodSelect.innerHTML = `<option value="none">No standalone server required</option>`;
                if (portGroupAttacker) portGroupAttacker.style.display = "none";
            } else {
                let hostCount = 0;
                availableHosts.forEach(host => {
                    // CONTEXT FIREWALL: Strictly isolate daemons based on attacker operating system
                    if (tech === "SMB") {
                        if (sourceOS === "windows" && host.id === "impacket") return;
                        if (sourceOS === "linux" && host.id === "win_share") return;
                    }
                    if (tech === "SSH" || tech === "SCP") {
                        if (sourceOS === "windows" && host.id === "ssh_daemon") return; // Block Linux on Windows Attacker
                        if (sourceOS === "linux" && host.id === "win_ssh_daemon") return; // Block Windows on Linux Attacker
                    }
                    
                    const option = document.createElement("option");
                    option.value = host.id;
                    option.text = host.name;
                    hostMethodSelect.appendChild(option);
                    hostCount++;
                });

                if (hostCount === 0) {
                    hostMethodSelect.innerHTML = `<option value="none">No standalone server required</option>`;
                    if (portGroupAttacker) portGroupAttacker.style.display = "none";
                }
            }
        }
    }
    // 2. RETRIEVE AND ENFORCE PORT DEFAULTS ACCORDING TO SELECTED ENGINE
    if (portInputAttacker) {
        const selectedHostId = hostMethodSelect ? hostMethodSelect.value : null;
        // Check exact engine ID matches first to respect user adjustments
        const activeHost = hostingDatabase.find(h => h.id === selectedHostId) || hostingDatabase.find(h => h.tech === tech);
        if (activeHost) {
            portInputAttacker.value = activeHost.defaultPort;
        }
    }

    // Preserve specialized inbound listening port views for active Netcat sequences
    if (tech === "NETCAT" && victimPortGroup && victimPortInput) {
        victimPortGroup.style.display = "block";
        victimPortInput.value = "4444";
    }
    
    // Completely compress visibility fields for completely interactive RDP profiles
    if (tech === "RDP" && subMethodSelect && subMethodSelect.parentElement) {
        subMethodSelect.parentElement.style.display = "none";
    }
    // Run continuous panel synchronization updates for SMB modules
    if (tech === "SMB" && subMethodSelect) {
        const sourceOS = document.getElementById("sourceOS").value;
        if (sourceOS === "windows") {
            if (subMethodSelect.value !== "smb_windows_native_share_win_host_exfil" && subMethodSelect.value !== "smb_replace_lolbas") {
                subMethodSelect.value = "smb_windows_native_share_win_host_exfil";
            }
        } else {
            if (subMethodSelect.value === "smb_windows_native_share_win_host_exfil") {
                subMethodSelect.value = currentDirection === "exfil" ? "smb_windows_native_share_linux_host_exfil" : "smb_windows";
            }
        }
    }

    // Manage smart visibility of the new dual SSH username fields
    const attackerSSHGroup = document.getElementById("attackerSSHUserGroup");
    const victimSSHGroup = document.getElementById("victimSSHUserGroup");
    
    if (attackerSSHGroup) attackerSSHGroup.style.display = "none";
    if (victimSSHGroup) victimSSHGroup.style.display = "none";

    if (tech === "SSH" || tech === "SCP") {
        const selectedSubId = subMethodSelect ? subMethodSelect.value : "";
        // Show fields conditionally depending on client/server node deployment roles
        if (selectedSubId.includes("client_mode") || selectedSubId === "sftp_windows_non_interactive" || selectedSubId === "sftp_linux_non_interactive" || selectedSubId === "sftp_windows_exfil_batch") {
            if (attackerSSHGroup) attackerSSHGroup.style.display = "block";
        } else if (selectedSubId.includes("server_mode") || selectedSubId === "scp_windows_native" || selectedSubId === "scp_windows_exfil_native" || selectedSubId === "scp_linux_exfil_native" || selectedSubId === "scp_linux") {
            if (victimSSHGroup) victimSSHGroup.style.display = "block";
        } else {
            if (attackerSSHGroup) attackerSSHGroup.style.display = "block";
        }
    }


    updateCommands();
}
/**
 * Updates default port variables when the attacker hosting daemon selection changes.
 */
function onWebEngineChange() {
    const hostMethodSelect = document.getElementById("hostMethod");
    const portInputAttacker = document.getElementById("hostPort");
    
    if (hostMethodSelect && portInputAttacker) {
        const selectedId = hostMethodSelect.value;
        const currentHost = hostingDatabase.find(h => h.id === selectedId);
        if (currentHost) {
            portInputAttacker.value = currentHost.defaultPort;
        }
    }
    updateCommands();
}

/**
 * Enforces automation exceptions like anchoring Apache ports for specific jobs.
 */
function onSubMethodChange() {
    const subMethodSelect = document.getElementById("subMethod");
    const hostMethodSelect = document.getElementById("hostMethod");
    const portInputAttacker = document.getElementById("hostPort");

    if (subMethodSelect && hostMethodSelect && portInputAttacker) {
        const selectedSubId = subMethodSelect.value;
        if (selectedSubId === "web_bitsadmin") {
            hostMethodSelect.value = "apache";
            portInputAttacker.value = "80";
        }
    }
    // Re-run dynamic panel check to handle SSH user field updates on sub-method flip
    const mainTechElement = document.getElementById("mainTech");
    if (mainTechElement) {
        renderDynamicHostPanel(mainTechElement.value);
    } else {
        updateCommands();
    }
}

/**
 * Triggers when the target operating system changes.
 */
function onTargetOSChange() {
    populateMainTechDropdown();
}

/**
 * Handles directional tab switching between Ingestion and Exfiltration.
 * Rotates UI layouts and recalculates available operational paths.
 * @param {string} direction - Active transfer direction ('ingest' or 'exfil').
 * @param {HTMLElement} button - The clicked tab element.
 */
function setDirection(direction, button) {
    currentDirection = direction;
    
    const container = document.querySelector('.direction-tabs-container');
    const tabs = document.querySelectorAll('.direction-tab');
    
    if (tabs) tabs.forEach(tab => tab.classList.remove('active'));
    if (button) button.classList.add('active');
    
    if (container) {
        if (direction === 'exfil') {
            container.classList.add('switched');
        } else {
            container.classList.remove('switched');
        }
    }
    
    // Completely rebuild the dropdown matrix to filter by the new direction
    populateMainTechDropdown();
}
/**
 * Copies string contents from a target code block into the system clipboard buffer.
 * Provides real-time UI button feedback animations.
 * @param {HTMLElement} button - The trigger element.
 * @param {string} textElementId - DOM ID containing target text contents.
 */
function copyToClipboard(button, textElementId) {
    const textElement = document.getElementById(textElementId);
    if (!textElement) return;
    
    const textToCopy = textElement.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = button.innerText;
        button.innerText = "✓ Copied!";
        button.classList.add("copied");
        setTimeout(() => {
            button.innerText = originalText;
            button.classList.remove("copied");
        }, 1500);
    }).catch(err => {
        console.error("Clipboard copy failed: ", err);
    });
}

/**
 * Main engine processing routine. Orchestrates live command building, 
 * string placeholder substitution, and rewires responsive UI indicators.
 * Escapes HTML characters to prevent multi-line scripts (like <<EOF) from breaking.
 */
function updateCommands() {
    const sourceOSElement = document.getElementById("sourceOS");
    const targetOSElement = document.getElementById("targetOS");
    const subMethodElement = document.getElementById("subMethod");
    const mainTechElement = document.getElementById("mainTech");

    if (!sourceOSElement || !targetOSElement || !subMethodElement || !mainTechElement) {
        return; // Guard rail to prevent initial DOM lifecycle sequence breaks
    }

    const sourceOS = sourceOSElement.value;
    const targetOS = targetOSElement.value;
    const selectedSubId = subMethodElement.value;
    
    const srcIp = document.getElementById("sourceIP").value || "10.10.14.5";
    const tgtIp = document.getElementById("targetIP").value || "10.10.10.100";
    const file = document.getElementById("fileName").value || "nc.exe";
    const userPort = document.getElementById("hostPort").value || "8000";
    
    const victimPortElement = document.getElementById("victimPort");
    const targetPort = (victimPortElement && victimPortElement.parentElement.style.display !== "none") 
        ? (victimPortElement.value || userPort) 
        : userPort;
        
    const mainTechVal = mainTechElement.value || "";
    // Compute the dynamic SSH username based on deployment node conditions
    const attackerSSHUserField = document.getElementById("attackerSSHUser");
    const victimSSHUserField = document.getElementById("victimSSHUser");
    
    let activeSSHUser = "root";
    const currentSubId = selectedSubId || "";

    if (currentSubId.includes("client_mode") || currentSubId === "sftp_windows_non_interactive" || currentSubId === "sftp_linux_non_interactive" || currentSubId === "ssh_linux_pipe" || currentSubId === "sftp_windows_exfil_batch") {
        // FORCE WINDOWS ATTACKER FALLBACK: If Attacker is Windows, 'root' is invalid
        if (sourceOS === "windows" && attackerSSHUserField && attackerSSHUserField.value === "root") {
            attackerSSHUserField.value = "Administrator";
        }
        
        if (attackerSSHUserField && attackerSSHUserField.value.trim() !== "") {
            activeSSHUser = attackerSSHUserField.value.trim();
        } else {
            activeSSHUser = (sourceOS === "windows") ? "Administrator" : "root";
            if (attackerSSHUserField) attackerSSHUserField.value = activeSSHUser;
        }
    } else if (currentSubId.includes("server_mode") || currentSubId === "scp_windows_native" || currentSubId === "scp_windows_exfil_native" || currentSubId === "scp_linux_exfil_native") {
        // FORCE WINDOWS TARGET FALLBACK: If Target is Windows, 'root' is invalid
        if (targetOS === "windows" && victimSSHUserField && victimSSHUserField.value === "root") {
            victimSSHUserField.value = "Administrator";
        }

        if (victimSSHUserField && victimSSHUserField.value.trim() !== "") {
            activeSSHUser = victimSSHUserField.value.trim();
        } else {
            activeSSHUser = (targetOS === "windows") ? "Administrator" : "root";
            if (victimSSHUserField) victimSSHUserField.value = activeSSHUser;
        }
    } else {
        if (attackerSSHUserField && attackerSSHUserField.value.trim() !== "") {
            activeSSHUser = attackerSSHUserField.value.trim();
        }
    }

    // --- CENTRAL HOST LOOKUP ENGINE ---
    let calculatedHostCmd = "";
    const hostMethodElement = document.getElementById("hostMethod");
    if (hostMethodElement) {
        const hostMethodId = hostMethodElement.value;
        const matchingHost = hostingDatabase.find(h => h.id === hostMethodId);
        
        if (matchingHost) {
            let cmdTemplate = matchingHost.template;
            cmdTemplate = cmdTemplate.replace(/<PORT>/g, userPort);
            cmdTemplate = cmdTemplate.replace(/<SRC_IP>/g, srcIp);
            cmdTemplate = cmdTemplate.replace(/<TGT_IP>/g, tgtIp);
            cmdTemplate = cmdTemplate.replace(/<FILE>/g, file);
            calculatedHostCmd = cmdTemplate;
        }
    }

    // Format connection port URL appending rules cleanly (stripping 80/443 defaults)
    const portUrlString = (userPort === "80" || userPort === "443") ? "" : `:${userPort}`;
    const srcLabelText = sourceOS === 'linux' ? "💻 Linux / Kali" : "💻 Windows Pivot";
    const tgtLabelText = targetOS === 'windows' ? "🎯 Windows Target" : "🎯 Linux Target";
    // Inject structural information straight back into real-time pipeline status cards
    const visualSource = document.getElementById("visualSource");
    const visualTarget = document.getElementById("visualTarget");
    if (visualSource) visualSource.innerHTML = `<div class="node-title">${srcLabelText}</div><div class="node-sub">IP: ${srcIp}</div>`;
    if (visualTarget) visualTarget.innerHTML = `<div class="node-title">${tgtLabelText}</div><div class="node-sub">IP: ${tgtIp} <br> File: ${file}</div>`;
    
    const arrowElement = document.getElementById("flowArrow");
    const dirTextElement = document.getElementById("flowDirText");
    
    // Compute readable clean tag strings for complex socket protocols
    const displayTech = mainTechVal === "BASE64" || mainTechVal === "RDP" || mainTechVal === "EVIL-WINRM" || mainTechVal === "METASPLOIT" 
        ? mainTechVal 
        : `${mainTechVal} (${userPort})`;

    if (arrowElement) {
        arrowElement.innerText = displayTech;
        if (currentDirection === 'exfil') {
            arrowElement.classList.add("reverse-arrow");
            arrowElement.style.color = "#f38ba8";
        } else {
            arrowElement.classList.remove("reverse-arrow");
            arrowElement.style.color = "#a6e3a1";
        }
    }

    if (dirTextElement) {
        if (currentDirection === 'exfil') {
            dirTextElement.innerText = "EXFILTRATE FROM";
            dirTextElement.style.color = "#f38ba8";
        } else {
            dirTextElement.innerText = "TRANSFER TO";
            dirTextElement.style.color = "#bac2de";
        }
    }
        // Initialize iteration sequences through step arrays
    const activeMethod = transferDatabase.find(m => m.id === selectedSubId);
    let htmlOutput = "";
    let stepCounter = 1;

    if (activeMethod && activeMethod.steps) {
        activeMethod.steps.forEach((step) => {
            let badgeClass = "badge-info";
            let machineLabel = "System Notification";
            
            if (step.role === "attacker") {
                badgeClass = "badge-attacker"; 
                machineLabel = `ATTACKER MACHINE - ${srcIp}`;
            } else if (step.role === "target") {
                badgeClass = "badge-target"; 
                machineLabel = `VICTIM MACHINE - ${tgtIp}`;
            }

            htmlOutput += `<div class="step-container">`;
            htmlOutput += `<div class="step-header-block">`;
            htmlOutput += `<span class="badge ${badgeClass}">${machineLabel}</span>`;
            htmlOutput += `<div class="step-title">Step ${stepCounter}: ${step.title}</div>`;
            htmlOutput += `</div>`;
            htmlOutput += `<div class="step-desc">${step.desc}</div>`;

            if (step.type === "code") {
                let finalCmd = step.template;
                
                // Perform structural mutations on remaining syntax targets seamlessly
                finalCmd = finalCmd.replace(/<HOST_CMD>/g, calculatedHostCmd);
                finalCmd = finalCmd.replace(/<SRC_IP>|IP-attacker/g, srcIp);
                finalCmd = finalCmd.replace(/<PORT_URL>/g, portUrlString);
                finalCmd = finalCmd.replace(/<PORT>/g, targetPort); 
                finalCmd = finalCmd.replace(/<SSH_USER>/g, activeSSHUser); // Dynamic resolution fix injected here
                finalCmd = finalCmd.replace(/<TGT_IP>|10\.11\.0\.4|0\.0\.0\.0/g, tgtIp);
                finalCmd = finalCmd.replace(/<FILE>|filename\.exe|wget\.exe|shell\.exe|fgdump\.exe/g, file);
                
                // CORE FIX v9: Escape brackets to prevent the browser from eating text like <<EOF inside innerHTML
                let safeCmd = finalCmd
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                
                const blockId = `code_block_${stepCounter}`;
                htmlOutput += `<div class="pre-wrapper">`;
                htmlOutput += `<button class="copy-btn" onclick="copyToClipboard(this, '${blockId}')">Copy</button>`;
                htmlOutput += `<pre id="${blockId}">${safeCmd}</pre>`; 
                htmlOutput += `</div>`;
            } else if (step.type === "info") {
                htmlOutput += `<div class="info-msg">ℹ️ ${step.desc}</div>`;
            }
            htmlOutput += `</div>`;
            
            stepCounter++;
        });
    }


    const commandOutputElement = document.getElementById("commandOutput");
    if (commandOutputElement) {
        commandOutputElement.innerHTML = htmlOutput;
    }
}
/**
 * REDCOURIER — Live UI Debugger Pipeline
 * Run debugApp() in the browser console (F12) to dump the complete operational matrix.
 */
function debugApp() {
    // 1. Retrieve all DOM elements and their current runtime values
    const state = {
        currentDirection: typeof currentDirection !== 'undefined' ? currentDirection : 'unknown',
        fileName: document.getElementById("fileName")?.value || "N/A",
        mainTech: document.getElementById("mainTech")?.value || "N/A",
        sourceOS: document.getElementById("sourceOS")?.value || "N/A",
        sourceIP: document.getElementById("sourceIP")?.value || "N/A",
        attackerSSHUser: document.getElementById("attackerSSHUser")?.value || "N/A",
        hostMethod: document.getElementById("hostMethod")?.value || "N/A",
        hostPort: document.getElementById("hostPort")?.value || "N/A",
        targetOS: document.getElementById("targetOS")?.value || "N/A",
        targetIP: document.getElementById("targetIP")?.value || "N/A",
        victimSSHUser: document.getElementById("victimSSHUser")?.value || "N/A",
        subMethod: document.getElementById("subMethod")?.value || "N/A",
        victimPort: document.getElementById("victimPort")?.value || "N/A"
    };

    // 2. Cross-reference active database objects for context validation
    const activeHost = typeof hostingDatabase !== 'undefined' ? hostingDatabase.find(h => h.id === state.hostMethod) : null;
    const activeMethod = typeof transferDatabase !== 'undefined' ? transferDatabase.find(m => m.id === state.subMethod) : null;

    // 3. Extract the actually rendered commands from the viewport container
    const outputElement = document.getElementById("commandOutput");
    let generatedSteps = [];
    if (outputElement) {
        const preBlocks = outputElement.querySelectorAll("pre");
        preBlocks.forEach((pre, index) => {
            generatedSteps.push(`Step ${index + 1}: ${pre.innerText}`);
        });
    }

    // 4. Construct the centralized plaintext debug report string
    let dump = "==================================================\n";
    dump += "          REDCOURIER LIVE DEBUG DUMP             \n";
    dump += "==================================================\n\n";
    
    dump += "--- UI STATE & CORE PARAMETERS ---\n";
    dump += `Direction  : ${state.currentDirection.toUpperCase()}\n`;
    dump += `File Name  : ${state.fileName}\n`;
    dump += `Main Tech  : ${state.mainTech}\n\n`;
    
    // Define whether SSH parameters are relevant for the active technique view
    const isSSH = state.mainTech === "SSH" || state.mainTech === "SCP";
    const attackerSSHDisplay = isSSH ? state.attackerSSHUser : "N/A (Not Applicable)";
    const victimSSHDisplay = isSSH ? state.victimSSHUser : "N/A (Not Applicable)";

    dump += "--- ATTACKER CONFIGURATION ---\n";
    dump += `Source OS  : ${state.sourceOS}\n`;
    dump += `Source IP  : ${state.sourceIP}\n`;
    dump += `SSH User   : ${attackerSSHDisplay}\n`;
    dump += `Host Engine: ${state.hostMethod} (${activeHost ? activeHost.name : 'No active template found'})\n`;
    dump += `Host Port  : ${state.hostPort}\n\n`;
    
    dump += "--- VICTIM CONFIGURATION ---\n";
    dump += `Target OS  : ${state.targetOS}\n`;
    dump += `Target IP  : ${state.targetIP}\n`;
    dump += `SSH User   : ${victimSSHDisplay}\n`;
    dump += `Sub Method : ${state.subMethod} (${activeMethod ? activeMethod.name : 'No active template found'})\n`;
    dump += `Target Port: ${state.victimPort}\n\n`;


    dump += "--- GENERATED COMMAND OUTPUT MATRIX ---\n";
    if (generatedSteps.length > 0) {
        generatedSteps.forEach(step => {
            dump += `${step}\n-----------------------------------\n`;
        });
    } else {
        dump += "No commands currently rendered in viewport.\n";
    }
    dump += "==================================================";

    // 5. Output structure to browser terminal and execute clipboard staging
    console.log(dump);
    navigator.clipboard.writeText(dump).then(() => {
        console.log("\n[+] SUCCESS: The debug dump has been automatically copied to your clipboard!");
        alert("Debug info copied to clipboard! You can now paste it directly into the chat.");
    }).catch(err => {
        console.warn("[-] Clipboard auto-copy blocked by browser security. Please manually copy the text block above.");
    });
}
// Expose the debugging routine to the global window scope for console access
window.debugApp = debugApp;

/**
 * Core application bootstrap trigger. Fires automatically upon final DOM completion.
 * Boots the initial layout state parameters for the central application workspace.
 */
window.onload = function() {
    // Execute a soft initialization of the main protocol matching lists
    populateMainTechDropdown();
    
    // Output structural verification directly into the diagnostic console log
    console.log("[REDCOURIER] Core application interface pipeline successfully initialized.");
};
