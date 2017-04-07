/*
* Reset Password Email Template
* Override Meteor defaults when sending a reset password email.
*/

// Set name and from email.
Accounts.emailTemplates.resetPassword.siteName = "Habitat Dispatch";
Accounts.emailTemplates.resetPassword.from     = "Habitat Dispatch <dispatch@tryhabitat.com>";

// Set a subject for the reset password email.
Accounts.emailTemplates.resetPassword.subject = (user) => "[Application Name] Reset Your Password";


// Set the body of the reset password email.
Accounts.emailTemplates.resetPassword.text = (user, url) => {
  const removeHash = url.replace('#/', '');
  return `A password reset has been requested for the account related to ${user.emails[0].address}.
To reset the password, visit the following link:
${removeHash}
If you did not request this reset, please ignore this email.

If you feel something is wrong, please contact support: support@tryhabitat.com.

Thanks!

The Habitat Team
`;
};
