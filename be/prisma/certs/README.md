# PostgreSQL TLS certificates

Put the PostgreSQL server/root CA certificate in this directory with this name:

```text
postgres-ca.pem
```

All `.pem` files in this directory are ignored by Git. Other file types are not
automatically ignored. Never commit a private `.key` or `.p12` file; add an
explicit ignore rule first.

For the remote PostgreSQL server, copy the following template into `be/.env`
and replace `YOUR_URL_ENCODED_PASSWORD`:

```env
DATABASE_URL="postgresql://root:YOUR_URL_ENCODED_PASSWORD@DB_HOST:5432/movement?schema=public&sslmode=require&sslcert=certs/postgres-ca.pem&sslaccept=strict"
```

Prisma resolves `sslcert` relative to the `be/prisma` directory, so the URL uses
`certs/postgres-ca.pem`, not `prisma/certs/postgres-ca.pem`.

If the supplied PEM is a client private key rather than a server/root CA
certificate, it cannot be used directly as `sslcert`. Convert the matching
client certificate and private key into `client-identity.p12`, then configure
Prisma with `sslidentity` and `sslpassword`.
