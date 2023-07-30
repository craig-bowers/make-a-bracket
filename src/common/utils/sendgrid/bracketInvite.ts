// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs

import sgMail, { MailDataRequired } from '@sendgrid/mail';

import type { User } from '../../types/user';
import type { Settings } from '../../types/bracket';
type BracketSettingsProps = {
  settings: Settings;
  user?: User | null;
  email: string;
  hash: string;
};

async function bracketInvite({
  settings,
  user,
  email,
  hash,
}: BracketSettingsProps) {
  sgMail.setApiKey(`${process.env.SENDGRID_API_KEY}`);

  const msg: MailDataRequired = {
    to: email,
    from: `${process.env.SENDGRID_SENDER}`,
    subject: 'Activate your MyEasel account.',
    // text: `You're one step away from activating your account. Click the link to get started: ${process.env.SITE_URL}/account/verify/${hash}`,
    // html: `You're one step away from activating your account. Click the link to get started: <a href="${process.env.SITE_URL}/account/verify/${hash}">Activate!</a>`,
    templateId: 'd-9918b923b4394a88b1f18eaee36b1947',
    dynamicTemplateData: {
      subject: `You're invited!`,
      heading: settings.bracket_type.includes('voting')
        ? 'Cast your votes!'
        : 'Set your picks!',
      preview: `${
        settings.bracket_type.includes('voting')
          ? 'Cast your votes!'
          : 'Set your picks!'
      } You've been invited to join a bracket!`,
      bracketName: settings.name,
      acceptLink: `${process.env.NEXT_PUBLIC_SITE_URL}/invite/bracket/${hash}`,
    },
  };

  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error(err);
  }
}

export default bracketInvite;
