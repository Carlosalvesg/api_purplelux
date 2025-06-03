const nodemailer = require('nodemailer');
require('dotenv').config();

// Verificar configurações de email
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Variáveis de ambiente ausentes:', missingVars);
  throw new Error(`Configuração de email incompleta. Faltam: ${missingVars.join(', ')}`);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificar conexão com o serviço de email
transporter.verify()
  .then(() => {
    console.log('Serviço de email configurado');
  })
  .catch((error) => {
    console.error('Erro na configuração do serviço de email:', error);
    throw error;
  });

const emailTemplates = {
  verification: (code) => ({
    subject: 'Verificação de Email - Sistema de Eventos',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1976d2; text-align: center;">Bem-vindo ao Sistema de Eventos!</h1>
        <p style="font-size: 16px;">Para completar seu cadastro, use o código de verificação abaixo:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #1976d2; font-size: 32px; letter-spacing: 5px;">${code}</h2>
        </div>
        <p style="font-size: 14px; color: #666;">Este código é válido por 30 minutos.</p>
        <p style="font-size: 14px; color: #666;">Se você não solicitou este código, por favor ignore este email.</p>
      </div>
    `
  }),
  passwordReset: (code) => ({
    subject: 'Redefinição de Senha - Sistema de Eventos',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1976d2; text-align: center;">Redefinição de Senha</h1>
        <p style="font-size: 16px;">Você solicitou a redefinição de sua senha. Use o código abaixo para continuar:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h2 style="color: #1976d2; font-size: 32px; letter-spacing: 5px;">${code}</h2>
        </div>
        <p style="font-size: 14px; color: #666;">Este código é válido por 30 minutos.</p>
        <p style="font-size: 14px; color: #666;">Se você não solicitou este código, por favor ignore este email.</p>
      </div>
    `
  })
};

const sendEmail = async (to, template, code) => {
  if (!to || !template || !code) {
    throw new Error('Parâmetros inválidos para envio de email');
  }

  const emailContent = emailTemplates[template](code);
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: emailContent.subject,
    html: emailContent.html
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error.message);
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
};

module.exports = {
  sendVerificationEmail: (email, code) => sendEmail(email, 'verification', code),
  sendPasswordResetEmail: (email, code) => sendEmail(email, 'passwordReset', code)
}; 