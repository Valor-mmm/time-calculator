import Link from 'next/link'

export const GermanImprint = () => {
  return (
    <article className="mx-auto max-w-lg p-8 bg-gray-100 dark:bg-gray-600 rounded-lg shadow-md mt-2">
      <h2 className="text-xl font-semibold mb-4">Impressum</h2>
      <section className="mb-4">
        <p>
          <span className="font-semibold">Verantwortlich für den Inhalt:</span>{' '}
          Stefan Hauser
        </p>
        <p>
          <span className="font-semibold">Kontakt:</span>{' '}
          <a href="mailto:time-calc-contact.s25q1@slmail.me">
            time-calc-contact.s25q1@slmail.me
          </a>
        </p>
      </section>
      <section className="mb-4">
        <p>
          <span className="font-semibold">Haftungsausschluss:</span> Diese
          Webseite dient ausschließlich der freien Nutzung zum Berechnen and
          Arbeiten mit Zeiten und betreibt keine kommerziellen Aktivitäten. Die
          bereitgestellten Informationen sind rein informativ und stellen keine
          Rechtsberatung dar.
        </p>
      </section>
      <section className="mb-4">
        <p>
          <span className="font-semibold">Datenschutz:</span> Für Informationen
          zum Datenschutz lesen Sie bitte unsere{' '}
          <Link className="underline text-blue-500" href="/privacy">
            Datenschutzerklärung
          </Link>
          .
        </p>
      </section>
      <section className="mb-4">
        <p>
          <span className="font-semibold">Urheberrecht:</span> Alle Inhalte
          dieser Webseite sind urheberrechtlich geschützt und dürfen ohne
          vorherige Genehmigung nicht vervielfältigt oder anderweitig verwendet
          werden.
        </p>
      </section>
      <section className="mb-4">
        <p>
          <span className="font-semibold">Hosting-Anbieter:</span> Die Webseite
          wird von Vercel gehostet. Für weitere Informationen zu den rechtlichen
          Richtlinien und Nutzungsbedingungen von Vercel besuchen Sie bitte die{' '}
          <a
            className="underline text-blue-500"
            href="https://vercel.com/legal/terms"
          >
            Vercel-Website
          </a>
          .
        </p>
      </section>
    </article>
  )
}
