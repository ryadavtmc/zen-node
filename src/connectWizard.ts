// ============================================================================
// ZenNode — Connect to Team Wizard
//
// A VS Code webview panel that lets the developer optionally connect to a
// ZenNode team. Shown after 3 completed sessions or via command.
// Handles signup, login, and invite code in one flow.
// ============================================================================

import * as vscode from 'vscode';
import { CloudSyncService } from './cloudSync';

export async function showConnectWizard(
    context: vscode.ExtensionContext,
    cloud: CloudSyncService,
    onConnected?: (teamName: string | null) => void,
): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'zennode.connect',
        'ZenNode — Connect to Team',
        vscode.ViewColumn.One,
        { enableScripts: true, retainContextWhenHidden: true },
    );

    panel.webview.html = _html(cloud.getCloudUrl());

    panel.webview.onDidReceiveMessage(async (msg) => {
        switch (msg.type) {
            case 'signup': {
                const result = await cloud.signup(
                    msg.cloudUrl, msg.email, msg.password, msg.displayName
                );
                if (result.ok) {
                    panel.webview.postMessage({ type: 'authSuccess', role: result.role });
                } else {
                    panel.webview.postMessage({ type: 'error', message: result.error });
                }
                break;
            }
            case 'login': {
                const result = await cloud.login(msg.cloudUrl, msg.email, msg.password);
                if (result.ok) {
                    panel.webview.postMessage({ type: 'authSuccess', role: result.role });
                    // If already on a team, close immediately
                    if (result.teamId) {
                        panel.dispose();
                        onConnected?.(null);
                    }
                } else {
                    panel.webview.postMessage({ type: 'error', message: result.error });
                }
                break;
            }
            case 'joinTeam': {
                const result = await cloud.joinTeam(msg.inviteCode);
                if (result.ok) {
                    panel.dispose();
                    onConnected?.(result.teamName ?? null);
                    vscode.window.showInformationMessage(
                        `🎉 Joined team "${result.teamName}"! Your sessions will now sync privately.`
                    );
                } else {
                    panel.webview.postMessage({ type: 'error', message: result.error });
                }
                break;
            }
            case 'skipTeam': {
                panel.dispose();
                break;
            }
        }
    }, undefined, context.subscriptions);
}

function _html(defaultCloudUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ZenNode — Connect to Team</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      margin: 0; padding: 32px;
      max-width: 480px;
    }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
    .subtitle { color: var(--vscode-descriptionForeground); margin-bottom: 28px; font-size: 13px; }

    .tabs { display: flex; gap: 0; margin-bottom: 24px; border-bottom: 1px solid var(--vscode-panel-border); }
    .tab {
      padding: 8px 20px; cursor: pointer; font-size: 13px;
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      color: var(--vscode-descriptionForeground);
    }
    .tab.active { border-bottom-color: var(--vscode-focusBorder); color: var(--vscode-foreground); font-weight: 600; }

    .step { display: none; }
    .step.active { display: block; }

    label { display: block; font-size: 12px; color: var(--vscode-descriptionForeground); margin-bottom: 5px; margin-top: 14px; }
    input {
      width: 100%;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, #3c3c3c);
      color: var(--vscode-input-foreground);
      padding: 7px 10px; border-radius: 3px; font-size: 13px; outline: none;
      box-sizing: border-box;
    }
    input:focus { border-color: var(--vscode-focusBorder); }

    .btn {
      width: 100%; margin-top: 20px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none; border-radius: 3px; padding: 9px; font-size: 13px;
      font-weight: 600; cursor: pointer;
    }
    .btn:hover { background: var(--vscode-button-hoverBackground); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary {
      background: transparent;
      color: var(--vscode-descriptionForeground);
      border: 1px solid var(--vscode-panel-border);
    }
    .btn-secondary:hover { color: var(--vscode-foreground); border-color: var(--vscode-focusBorder); }

    .error { color: var(--vscode-errorForeground); font-size: 12px; margin-top: 10px; min-height: 16px; }
    .advanced-toggle { font-size: 11px; color: var(--vscode-descriptionForeground); cursor: pointer; margin-top: 16px; }
    .advanced { display: none; }
    .invite-hint { font-size: 12px; color: var(--vscode-descriptionForeground); margin-top: 8px; }
    .success-icon { font-size: 32px; text-align: center; margin-bottom: 12px; }
    .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid transparent;
      border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <h1>🧠 Connect to your team</h1>
  <p class="subtitle">ZenNode works great on its own. Connecting lets your manager see team wellbeing trends — only anonymized summaries are ever shared.</p>

  <!-- Step 1: Auth -->
  <div id="step-auth" class="step active">
    <div class="tabs">
      <div class="tab active" onclick="switchTab('signup')">Create account</div>
      <div class="tab" onclick="switchTab('login')">Sign in</div>
    </div>

    <!-- Signup form -->
    <div id="form-signup">
      <label>Your name (shown to manager only if you opt in)</label>
      <input type="text" id="display-name" placeholder="Alex Chen"/>
      <label>Email</label>
      <input type="email" id="signup-email" placeholder="you@company.com"/>
      <label>Password</label>
      <input type="password" id="signup-password" placeholder="Min 8 characters"/>
      <div class="advanced-toggle" onclick="toggleAdvanced()">⚙ Advanced: change server URL</div>
      <div class="advanced" id="advanced-section">
        <label>ZenNode Cloud URL</label>
        <input type="text" id="cloud-url" value="${defaultCloudUrl}"/>
      </div>
      <button class="btn" id="signup-btn" onclick="doSignup()">Create account</button>
    </div>

    <!-- Login form -->
    <div id="form-login" style="display:none">
      <label>Email</label>
      <input type="email" id="login-email" placeholder="you@company.com"/>
      <label>Password</label>
      <input type="password" id="login-password" placeholder="Your password"/>
      <button class="btn" id="login-btn" onclick="doLogin()">Sign in</button>
    </div>

    <div class="error" id="auth-error"></div>
  </div>

  <!-- Step 2: Invite code -->
  <div id="step-team" class="step">
    <div class="success-icon">✅</div>
    <h1 style="text-align:center;margin-bottom:8px">Account ready</h1>
    <p class="subtitle" style="text-align:center">Got an invite code from your manager? Enter it below.<br>You can also skip and join later.</p>
    <label>Team invite code</label>
    <input type="text" id="invite-code" placeholder="ZEN-XXXXXXXX" style="text-transform:uppercase;letter-spacing:2px"/>
    <p class="invite-hint">Ask your manager for the invite code shown in their dashboard</p>
    <button class="btn" id="join-btn" onclick="doJoin()">Join team</button>
    <button class="btn btn-secondary" style="margin-top:8px" onclick="doSkip()">Skip for now</button>
    <div class="error" id="team-error"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    window.addEventListener('message', e => {
      const msg = e.data;
      if (msg.type === 'authSuccess') {
        document.getElementById('step-auth').classList.remove('active');
        document.getElementById('step-team').classList.add('active');
        setLoading(false);
      } else if (msg.type === 'error') {
        const errEl = document.getElementById(
          document.getElementById('step-team').classList.contains('active')
            ? 'team-error' : 'auth-error'
        );
        errEl.textContent = msg.message || 'Something went wrong';
        setLoading(false);
      }
    });

    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach((t, i) => {
        t.classList.toggle('active', (i === 0) === (tab === 'signup'));
      });
      document.getElementById('form-signup').style.display = tab === 'signup' ? 'block' : 'none';
      document.getElementById('form-login').style.display  = tab === 'login'  ? 'block' : 'none';
      document.getElementById('auth-error').textContent = '';
    }

    function toggleAdvanced() {
      const el = document.getElementById('advanced-section');
      el.style.display = el.style.display === 'block' ? 'none' : 'block';
    }

    function setLoading(loading) {
      ['signup-btn','login-btn','join-btn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.disabled = loading; }
      });
    }

    function doSignup() {
      const email    = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const name     = document.getElementById('display-name').value.trim();
      const cloudUrl = document.getElementById('cloud-url').value.trim() || '${defaultCloudUrl}';
      document.getElementById('auth-error').textContent = '';
      if (!email || !password) { document.getElementById('auth-error').textContent = 'Email and password required'; return; }
      if (password.length < 8) { document.getElementById('auth-error').textContent = 'Password must be at least 8 characters'; return; }
      setLoading(true);
      vscode.postMessage({ type: 'signup', email, password, displayName: name, cloudUrl });
    }

    function doLogin() {
      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const cloudUrl = document.getElementById('cloud-url')?.value.trim() || '${defaultCloudUrl}';
      document.getElementById('auth-error').textContent = '';
      if (!email || !password) { document.getElementById('auth-error').textContent = 'Email and password required'; return; }
      setLoading(true);
      vscode.postMessage({ type: 'login', email, password, cloudUrl });
    }

    function doJoin() {
      const code = document.getElementById('invite-code').value.trim().toUpperCase();
      document.getElementById('team-error').textContent = '';
      if (!code) { document.getElementById('team-error').textContent = 'Enter an invite code'; return; }
      setLoading(true);
      vscode.postMessage({ type: 'joinTeam', inviteCode: code });
    }

    function doSkip() {
      vscode.postMessage({ type: 'skipTeam' });
    }

    // Enter key support
    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter') { return; }
      if (document.getElementById('step-team').classList.contains('active')) { doJoin(); }
      else if (document.getElementById('form-login').style.display !== 'none') { doLogin(); }
      else { doSignup(); }
    });
  </script>
</body>
</html>`;
}
