/**
 * Official Adam G Theme Welcome Email Template for Adamjee Coaching Center
 * Used for Students, Teachers, Staff, and Branch Admins
 */
export const getWelcomeEmailTemplate = ({
  name,
  role,
  id,
  grNo,
  className,
  sectionName,
  email,
  password,
  branchName,
  loginUrl = "https://adamjeecoaching.com/login"
}) => {
  const roleLabel = role?.replace(/_/g, ' ') || 'User';
  const loginId = email || id || grNo || "Your registered email";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Adamjee Coaching</title>
      <style>
        body { margin: 0; padding: 0; background-color: #0b1528; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #0b1528; padding: 30px 10px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.25); border: 1px solid #1e293b; }
        .header { background: linear-gradient(135deg, #091a36 0%, #0f2a5c 50%, #173877 100%); padding: 36px 20px; text-align: center; border-bottom: 3px solid #f59e0b; }
        .logo-img { max-height: 75px; max-width: 200px; width: auto; height: auto; margin-bottom: 12px; display: inline-block; }
        .inst-title { color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin: 0; }
        .inst-sub { color: #f59e0b; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin: 5px 0 0 0; }
        .badge { background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #f59e0b; padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; margin-top: 14px; letter-spacing: 1px; }
        .content { padding: 36px 30px; color: #334155; background-color: #ffffff; }
        .greeting { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; }
        .intro { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; }
        .cred-card { background: #f8fafc; border: 2px solid #e2e8f0; border-top: 4px solid #0f2a5c; border-radius: 12px; padding: 22px; margin: 24px 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .cred-title { font-size: 14px; font-weight: 800; color: #0f2a5c; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 8px 0; font-size: 14px; vertical-align: middle; }
        .info-label { width: 38%; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 12px; }
        .info-value { width: 62%; color: #0f172a; font-weight: 700; font-size: 14px; }
        .pass-badge { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 5px 12px; border-radius: 6px; font-family: monospace; font-size: 15px; font-weight: 700; display: inline-block; }
        .btn-wrapper { text-align: center; margin: 30px 0 20px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #0f2a5c 0%, #1e40af 100%); color: #ffffff !important; padding: 14px 34px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(15, 42, 92, 0.3); }
        .warning-box { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #92400e; line-height: 1.5; }
        .footer { background-color: #091a36; padding: 26px 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #1e293b; }
        .footer a { color: #f59e0b; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <!-- Header with Adam G theme & Logo -->
          <div class="header">
            <img src="cid:adamjee-logo" alt="Adamjee Coaching Centre" class="logo-img" onerror="this.style.display='none'" />
            <h1 class="inst-title">Adamjee Coaching Centre</h1>
            <p class="inst-sub">Excellence In Education Since 1972</p>
            <div class="badge">Official Portal Access</div>
          </div>
          
          <!-- Content Body -->
          <div class="content">
            <h2 class="greeting">Welcome, ${name}!</h2>
            <p class="intro">
              Your official account has been created on the Adamjee Coaching Management System as a 
              <strong>${roleLabel}</strong>${branchName ? ` for <strong>${branchName}</strong>` : ''}.
              Below are your portal login credentials.
            </p>
            
            <!-- Credentials Card -->
            <div class="cred-card">
              <div class="cred-title">🔐 YOUR LOGIN CREDENTIALS</div>
              <table class="info-table">
                ${id ? `
                <tr>
                  <td class="info-label">Registration / ID:</td>
                  <td class="info-value">${id}</td>
                </tr>` : ''}
                ${grNo ? `
                <tr>
                  <td class="info-label">GR / Roll No:</td>
                  <td class="info-value">${grNo}</td>
                </tr>` : ''}
                ${className ? `
                <tr>
                  <td class="info-label">Class & Section:</td>
                  <td class="info-value">${className} ${sectionName ? `(${sectionName})` : ''}</td>
                </tr>` : ''}
                <tr>
                  <td class="info-label">Login ID / Email:</td>
                  <td class="info-value" style="color: #0f2a5c;">${loginId}</td>
                </tr>
                <tr>
                  <td class="info-label">Initial Password:</td>
                  <td class="info-value">
                    <span class="pass-badge">${password || 'Welcome@123'}</span>
                  </td>
                </tr>
              </table>
            </div>

            <div class="warning-box">
              ⚠️ <strong>Security Notice:</strong> For your account security, please change this temporary password immediately after your first login.
            </div>
            
            <!-- Action Button -->
            <div class="btn-wrapper">
              <a href="${loginUrl}" class="btn" target="_blank">Access Portal Dashboard &rarr;</a>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 6px 0; font-weight: 600; color: #ffffff;">Adamjee Coaching Centre — Karachi, Pakistan</p>
            <p style="margin: 0 0 10px 0;">Need help? Contact support at <a href="mailto:support@adamjeecoaching.com">support@adamjeecoaching.com</a></p>
            <p style="margin: 0; color: #64748b; font-size: 11px;">&copy; 2026 Adamjee Coaching Centre. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

