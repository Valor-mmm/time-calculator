import Link from 'next/link'

export const EnglishImprint = () => {
  return (
    <article className="mx-auto max-w-lg p-8 bg-gray-100 dark:bg-gray-600 rounded-lg shadow-md mt-2">
      <h2 className="text-xl font-semibold mb-4">Imprint</h2>
      <section className="mb-4">
        <p>
          <span className="font-semibold">Responsible for Content:</span> Stefan
          Hauser
        </p>
        <p>
          <span className="font-semibold">Contact:</span>{' '}
          <a href="mailto:time-calc-contact.s25q1@slmail.me">
            time-calc-contact.s25q1@slmail.me
          </a>
        </p>
      </section>
      <section className="mb-4">
        <p>
          <span className="font-semibold">Disclaimer:</span> This website is
          solely for free use for calculating and working with times and does
          not engage in commercial activities. The information provided is
          purely informational and is not intended as legal advice.
        </p>
      </section>
      <section className="mb-4">
        <p>
          <span className="font-semibold">Data Protection:</span> For
          information on data protection, please read our{' '}
          <Link className="underline text-blue-500" href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
      <section className="mb-4">
        <p>
          <span className="font-semibold">Copyright:</span> All content on this
          website is copyrighted and may not be reproduced or used in any way
          without prior permission.
        </p>
      </section>
      <section className="mb-4">
        <p>
          <span className="font-semibold">Hosting Provider:</span> The website
          is hosted by Vercel. For more information on Vercels legal policies
          and terms of service, please visit the{' '}
          <a
            className="underline text-blue-500"
            href="https://vercel.com/legal/terms"
          >
            Vercel website
          </a>
          .
        </p>
      </section>
    </article>
  )
}
