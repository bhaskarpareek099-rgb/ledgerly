// Genuine email validation and disposable domain blocker

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10minemail.com',
  'burnermail.io',
  'crazymailing.com',
  'disposablemail.com',
  'dispostable.com',
  'disposable.com',
  'emailondeck.com',
  'fakeinbox.com',
  'fakemailgenerator.com',
  'generator.email',
  'getairmail.com',
  'guerrillamail.biz',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'inboxkitten.com',
  'inboxbear.com',
  'mailcatch.com',
  'maildrop.cc',
  'mailinator.com',
  'mailinator.net',
  'mailinator2.com',
  'mailnull.com',
  'mailpoof.com',
  'mailsac.com',
  'minuteinbox.com',
  'mohmal.com',
  'mytemp.email',
  'nada.ltd',
  'sharklasers.com',
  'temp-mail.io',
  'temp-mail.org',
  'tempail.com',
  'tempinbox.com',
  'tempmail.com',
  'tempmail.net',
  'tempmailo.com',
  'throwawaymail.com',
  'tmail.ws',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'einrot.com',
])

const BLOCKED_TLDS = new Set([
  'test',
  'example',
  'invalid',
  'localhost',
  'local',
  'onion',
  'internal',
  'corp',
  'fake',
])

const SUSPICIOUS_DOMAIN_KEYWORDS = [
  'tempmail',
  'temp-mail',
  'disposable',
  'throwaway',
  'burnermail',
  'fakemail',
  'fakeinbox',
  'trashmail',
  'mailinator',
  'guerrilla',
  '10minute',
  'minuteinbox',
  'sharklaser',
  'yopmail',
  'mohmal',
  'mytemp',
]

export function validateGenuineEmail(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase()
  if (!email) {
    return { valid: false, error: 'Please enter your email address.' }
  }

  // RFC standard email format regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid, complete email address (e.g. name@company.com or name@gmail.com).' }
  }

  const parts = email.split('@')
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid email address structure.' }
  }

  const [username, domain] = parts

  // Prevent obvious dummy username repetitions like asdf@asdf.com or test@test.com
  if (username.length < 2) {
    return { valid: false, error: 'Email username must be at least 2 characters long.' }
  }

  const domainParts = domain.split('.')
  const tld = domainParts[domainParts.length - 1]
  const domainName = domainParts[0]

  if (domainParts.length < 2 || tld.length < 2) {
    return { valid: false, error: 'Please use an email with a valid domain extension (e.g. .com, .in, .org).' }
  }

  if (BLOCKED_TLDS.has(tld)) {
    return { valid: false, error: 'Testing, placeholder, or invalid top-level domains are not allowed. Please enter your real email.' }
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: 'Temporary and disposable email services are strictly prohibited. Please use your genuine business or personal email (e.g. Gmail, Outlook, Yahoo, or your custom company domain).',
    }
  }

  // Block domains containing suspicious temporary/fake patterns
  for (const keyword of SUSPICIOUS_DOMAIN_KEYWORDS) {
    if (domain.includes(keyword)) {
      return {
        valid: false,
        error: 'Temporary and disposable email domains are blocked. Please provide a genuine email address.',
      }
    }
  }

  // Block dummy domains like test.com, fake.com, asdf.com, example.com, dummy.com
  const dummyDomains = new Set(['test.com', 'fake.com', 'asdf.com', 'dummy.com', 'example.com', 'sample.com', 'testing.com'])
  if (dummyDomains.has(domain)) {
    return {
      valid: false,
      error: 'Placeholder email domains are not allowed. Please use your genuine email address.',
    }
  }

  // Prevent repeated identical username and domain (e.g., test@test.com or asdf@asdf.com)
  if (username === domainName && ['test', 'fake', 'asdf', 'dummy', 'user', 'admin'].includes(username)) {
    return {
      valid: false,
      error: 'Please enter a genuine, personal or business email address.',
    }
  }

  return { valid: true, email }
}
