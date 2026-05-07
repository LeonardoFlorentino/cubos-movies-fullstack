import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildPasswordResetTemplate,
  buildReleaseReminderTemplate,
} from '../common/email/email-templates';

interface BaseMailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface PasswordResetMailPayload {
  to: string;
  userName: string;
  resetUrl: string;
}

interface ReleaseReminderMailPayload {
  to: string;
  userName: string;
  movieTitle: string;
  releaseDate: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.from = this.configService.get<string>(
      'MAIL_FROM',
      'onboarding@resend.dev',
    );
  }

  async sendPasswordResetEmail(
    payload: PasswordResetMailPayload,
  ): Promise<void> {
    const template = buildPasswordResetTemplate({
      userName: payload.userName,
      resetUrl: payload.resetUrl,
    });

    await this.sendMail({
      to: payload.to,
      subject: 'Cubos Movies | Recuperação de senha',
      text: template.text,
      html: template.html,
    });
  }

  async sendReleaseReminderEmail(
    payload: ReleaseReminderMailPayload,
  ): Promise<void> {
    const template = buildReleaseReminderTemplate({
      userName: payload.userName,
      movieTitle: payload.movieTitle,
      releaseDate: payload.releaseDate,
    });

    await this.sendMail({
      to: payload.to,
      subject: `Cubos Movies | "${payload.movieTitle}" estreia hoje`,
      text: template.text,
      html: template.html,
    });
  }

  private async sendMail(payload: BaseMailPayload): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(
        `RESEND_API_KEY nao configurada. Envio para ${payload.to} ignorado.`,
      );
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      const errorMessage = responseText || 'Erro desconhecido no Resend';
      this.logger.error(
        `Falha ao enviar e-mail para ${payload.to}: ${errorMessage}`,
      );
      throw new Error('Falha no envio de e-mail');
    }

    this.logger.log(
      `E-mail enfileirado para ${payload.to}. Resposta: ${responseText || 'ok'}`,
    );
  }
}
