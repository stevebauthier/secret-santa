import nodemailer from 'nodemailer';


function getTransport() {
    return nodemailer.createTransport({
        host: 'mail.buckingham-academy.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}


export async function sendAssignmentEmail({ to, giverName, receiverName, receiverNickname, receiverEmail, participantLink, messageTemplate }) {
    const text = (messageTemplate || defaultTemplate)
        .replaceAll('{{giverName}}', giverName)
        .replaceAll('{{receiverName}}', receiverName)
        .replaceAll('{{receiverNickname}}', receiverNickname || receiverName)
        .replaceAll('{{receiverEmail}}', receiverEmail)
        .replaceAll('{{participantLink}}', participantLink);
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER } = process.env;
    const HC_HOST = 'mail.buckingham-academy.com';
    console.log('SMTP env seen:', {
        host: HC_HOST, port: SMTP_PORT, secure: SMTP_SECURE, user: SMTP_USER
    });


    const transporter = getTransport();
    await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject: '🎁 Your Secret Santa assignment',
        text,
        html: `<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace">${text}</pre>`,
    });
}


export async function sendSuggestionNotification({ to, authorName, targetName, participantLink }) {
    const transporter = getTransport();
    await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject: `💡 New gift suggestion for ${targetName}`,
        text: `${authorName} added a new suggestion for ${targetName}.\n\nSee updates: ${participantLink}`,
    });
    console.log('Email sent..')
}


export const defaultTemplate = `Hey {{giverName}}!\n\nYou’ve been assigned: {{receiverName}} ({{receiverNickname}})\nContact: {{receiverEmail}}\n\nManage suggestions here:\n{{participantLink}}\n\nHappy gifting! 🎄`;