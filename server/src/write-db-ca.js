import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

if (!process.env.DATABASE_URL) {
  throw new Error('Falta configurar DATABASE_URL.');
}

const encodedCertificate = process.env.DATABASE_CA_CERT_BASE64;
if (!encodedCertificate) {
  throw new Error('Falta configurar DATABASE_CA_CERT_BASE64.');
}

const certificate = Buffer.from(encodedCertificate, 'base64');
if (!certificate.toString('utf8').includes('-----BEGIN CERTIFICATE-----')) {
  throw new Error('DATABASE_CA_CERT_BASE64 does not contain a valid PEM certificate.');
}

const certificateDirectory = resolve('prisma');
await mkdir(certificateDirectory, { recursive: true });
await writeFile(resolve(certificateDirectory, 'ca.pem'), certificate, { mode: 0o600 });
console.log('Certificado CA de MySQL configurado.');
