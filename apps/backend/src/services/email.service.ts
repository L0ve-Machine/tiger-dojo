import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Gmail用の設定（環境変数から取得）
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_APP_PASSWORD || ''
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `FX Tiger Dojo <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '')
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendApprovalRequest(pendingUser: {
    id: string;
    email: string;
    name: string;
    approvalToken: string;
  }): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fx-tiger-dojo.com';
    const approvalUrl = `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/approve/${pendingUser.approvalToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>新規ユーザー登録申請</h1>
            </div>
            <div class="content">
              <p>新しいユーザーからアカウント作成の申請がありました。</p>
              
              <div class="info">
                <h3>申請者情報</h3>
                <p><strong>名前:</strong> ${pendingUser.name}</p>
                <p><strong>メールアドレス:</strong> ${pendingUser.email}</p>
                <p><strong>申請日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
              </div>
              
              <p>以下のボタンをクリックして、申請を承認または拒否してください。</p>
              
              <div style="text-align: center;">
                <a href="${approvalUrl}" class="button">承認画面へ移動</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                このメールに心当たりがない場合は、無視してください。
              </p>
            </div>
            <div class="footer">
              <p>© 2024 FX Tiger Dojo. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: '【承認待ち】新規ユーザー登録申請',
      html
    });
  }

  async sendApprovalNotification(userEmail: string, approved: boolean, reason?: string): Promise<void> {
    const subject = approved ? 'アカウント登録が承認されました' : 'アカウント登録申請について';
    
    const html = approved ? `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>アカウント登録承認のお知らせ</h1>
            </div>
            <div class="content">
              <p>FX Tiger Dojoへようこそ！</p>
              <p>あなたのアカウント登録申請が承認されました。</p>
              
              <p>以下のボタンからログインして、学習を開始してください。</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">ログイン画面へ</a>
              </div>
              
              <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
            </div>
            <div class="footer">
              <p>© 2024 FX Tiger Dojo. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>アカウント登録申請について</h1>
            </div>
            <div class="content">
              <p>申し訳ございませんが、あなたのアカウント登録申請は承認されませんでした。</p>
              ${reason ? `<p><strong>理由:</strong> ${reason}</p>` : ''}
              <p>ご質問がございましたら、サポートまでお問い合わせください。</p>
            </div>
            <div class="footer">
              <p>© 2024 FX Tiger Dojo. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }
}

export const emailService = new EmailService();