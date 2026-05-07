interface PasswordResetTemplateInput {
  userName: string;
  resetUrl: string;
}

interface ReleaseReminderTemplateInput {
  userName: string;
  movieTitle: string;
  releaseDate: string;
}

export function buildPasswordResetTemplate({
  userName,
  resetUrl,
}: PasswordResetTemplateInput): { text: string; html: string } {
  const text = [
    `Olá ${userName},`,
    '',
    'Recebemos uma solicitação para redefinir sua senha da Cubos Movies.',
    `Use este link para criar uma nova senha: ${resetUrl}`,
    '',
    'Este link expira em 30 minutos.',
    'Se você não solicitou isso, pode ignorar este e-mail com segurança.',
    '',
    'Equipe Cubos Movies',
  ].join('\n');

  const html = `
  <div style="margin:0;padding:0;background:#f6f3ec;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#f6f3ec;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid rgba(120,105,164,0.26);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:0;background:linear-gradient(120deg,#6d4bc0 0%,#8d67ce 55%,#cbb2f0 100%);">
                <div style="padding:24px 28px;color:#ffffff;">
                  <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;opacity:0.9;">Cubos Movies</p>
                  <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:800;">Recuperação de Senha</h1>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#1f2432;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.55;">Olá <strong>${escapeHtml(userName)}</strong>,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#3f4659;">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para escolher uma nova senha e voltar para seus filmes.</p>
                <p style="margin:0 0 20px;">
                  <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:12px 20px;background:#6d4bc0;color:#f8f2ff;text-decoration:none;border-radius:10px;font-weight:700;letter-spacing:0.01em;">Criar Nova Senha</a>
                </p>
                <p style="margin:0 0 10px;font-size:13px;color:#747e94;line-height:1.6;">Este link expira em <strong>30 minutos</strong>.</p>
                <p style="margin:0;font-size:13px;color:#747e94;line-height:1.6;">Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f7f3ff;border-top:1px solid rgba(120,105,164,0.2);font-size:12px;color:#5a6280;">
                <p style="margin:0;">Esta é uma mensagem automática da Cubos Movies.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  return { text, html };
}

export function buildReleaseReminderTemplate({
  userName,
  movieTitle,
  releaseDate,
}: ReleaseReminderTemplateInput): { text: string; html: string } {
  const text = [
    `Olá ${userName},`,
    '',
    `Seu filme "${movieTitle}" estreia hoje (${releaseDate}).`,
    '',
    'Aproveite a estreia!',
    'Equipe Cubos Movies',
  ].join('\n');

  const html = `
  <div style="margin:0;padding:0;background:#f6f3ec;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#f6f3ec;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid rgba(120,105,164,0.26);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:22px 28px;background:linear-gradient(120deg,#6d4bc0 0%,#8d67ce 55%,#cbb2f0 100%);color:#ffffff;">
                <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;opacity:0.9;">Cubos Movies</p>
                <h1 style="margin:0;font-size:23px;line-height:1.25;font-weight:800;">Lembrete de Estreia</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#1f2432;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.55;">Olá <strong>${escapeHtml(userName)}</strong>,</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3f4659;">A espera acabou. O filme abaixo estreia hoje:</p>
                <div style="padding:14px 16px;border-radius:12px;background:#f7f3ff;border:1px solid rgba(109,75,192,0.24);">
                  <p style="margin:0 0 6px;font-size:17px;line-height:1.35;font-weight:700;color:#2c2354;">${escapeHtml(movieTitle)}</p>
                  <p style="margin:0;font-size:13px;color:#5f6782;">Data de estreia: ${escapeHtml(releaseDate)}</p>
                </div>
                <p style="margin:18px 0 0;font-size:14px;color:#3f4659;">Aproveite a estreia e mantenha sua lista de filmes atualizada.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
