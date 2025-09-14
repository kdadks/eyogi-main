interface EmailTemplateProps {
  name: string
  subject: string
  message: string
  email: string
}

export const EmailTemplate = ({ name, subject, message, email }: EmailTemplateProps) => (
  <div>
    <h1>Subject: {subject}</h1>
    <h1>
      Name: {name}, Email {email}
    </h1>
    <h3>{message}</h3>
  </div>
)
