// Function to populate the menu based on the selected platform and transfer destination
function populateMenu() {
    const platformSelectVictim = document.getElementById('platformSelectVictim');
    const transferToRadios = document.querySelectorAll('input[name="switch-transfer"]');
    const techniqueList = document.getElementById('technique-list');

    // Event listener for changing the platform select and transfer radio buttons
    platformSelectVictim.addEventListener('change', updateMenu);
    transferToRadios.forEach(radio => {
        radio.addEventListener('change', updateMenu);
    });

    function updateMenu() {
        const selectedPlatform = platformSelectVictim.value;
        const selectedTransferTo = Array.from(transferToRadios).find(radio => radio.checked).value;

        // Clear the current list
        techniqueList.innerHTML = '';

        // Filter techniques based on selected platform and transfer destination
        const filteredTechniques = techniques.filter(technique => 
            technique.platforms.includes(selectedPlatform) && 
            technique.fileTo === selectedTransferTo
        );

        // Fill the list with filtered techniques
        filteredTechniques.forEach(technique => {
            const listItem = document.createElement('li');
            listItem.textContent = technique.name;
            listItem.addEventListener('click', () => displayCommands(technique, selectedTransferTo)); // Geef selectedTransferTo door
            techniqueList.appendChild(listItem);
        });
    }
}

// Function to display the commands
function displayCommands(technique, selectedTransferTo) {
    const commandOutput = document.getElementById('command-output');
    commandOutput.innerHTML = ''; // Clear the current output

    technique.commands.forEach(cmd => {
        // Create a container for the command
        const commandContainer = document.createElement('div');
        
        // Add the machine information
        const machineInfo = document.createElement('strong');
        machineInfo.textContent = cmd.machine.charAt(0).toUpperCase() + cmd.machine.slice(1) + ": "; // "Attacker:" or "Victim:"
        
        // Debugging: Check the filename and command before replacement
        const filenameValue = document.getElementById('transferfile').value;
        console.log('Filename:', filenameValue);
        console.log('Command before replacement:', cmd.command);
        
        // Create the command element
        const commandElement = document.createElement('span');
        commandElement.textContent = cmd.command
            .replace('{attacker_ip}', document.getElementById('attackerIp').value)
            .replace('{victim_ip}', document.getElementById('victimIp').value)
            .replace('{attacker_port}', document.getElementById('attackerPort').value) // Use attacker port
            .replace('{victim_port}', document.getElementById('victimPort').value) // Use victim port
            .replace(/{filename}/g, filenameValue); // Replace all filenames in commands
        
        // Add the machine information and command to the container
        commandContainer.appendChild(machineInfo);
        commandContainer.appendChild(commandElement);
        
        // Add the container to the output
        commandOutput.appendChild(commandContainer);
    });

    // Add "Copy to Clipboard" button after commands are displayed
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Commands';
    copyButton.addEventListener('click', () => {
        const commandText = Array.from(commandOutput.querySelectorAll('span'))
            .map(span => span.textContent)
            .join('\n');

        navigator.clipboard.writeText(commandText)
            .then(() => alert('Commands copied to clipboard!'))
            .catch(err => console.error('Failed to copy:', err));
    });

    // Clear previous button instances to prevent duplicates
    const existingButton = document.getElementById('copyButton');
    if (existingButton) existingButton.remove();

    copyButton.id = 'copyButton';
    commandOutput.appendChild(copyButton);
}

// Initialiseer het menu bij het laden van de pagina
document.addEventListener('DOMContentLoaded', populateMenu);
