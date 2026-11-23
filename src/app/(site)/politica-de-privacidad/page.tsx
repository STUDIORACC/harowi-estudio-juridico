import type { Metadata } from 'next';
import { PageHeader } from '@/components/site/PageHeader';
import { routes } from '@/config/site';
import { getSiteSettings } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Cómo se tratan los datos personales que se envían a través de los formularios del sitio.',
  alternates: { canonical: routes.privacy },
  robots: { index: false, follow: true },
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHeader
        overline="Información legal"
        title="Política de privacidad"
        description="Cómo se recogen, se usan y se conservan los datos personales enviados a través de este sitio."
        breadcrumbs={[{ label: 'Inicio', href: routes.home }, { label: 'Política de privacidad' }]}
      />

      <article className="shell max-w-3xl py-16 sm:py-20">
        <div className="prose-legal">
          <h2>Responsable del tratamiento</h2>
          <p>
            {settings.studio_legal_name}, con oficina en {settings.address}, {settings.address_city}.
            Correo de contacto: {settings.email}.
          </p>

          <h2>Datos que se recogen</h2>
          <p>
            Únicamente los que la persona interesada facilita de forma voluntaria a través de los
            formularios del sitio:
          </p>
          <ul>
            <li>Formulario de consulta: nombre, teléfono, WhatsApp, correo, área, servicio, descripción del caso, modalidad y preferencia de contacto.</li>
            <li>Solicitud de cita: nombre, correo, teléfono, profesional, fecha, horario, modalidad y comentarios.</li>
            <li>Formulario de contacto: nombre, correo, teléfono y mensaje.</li>
          </ul>

          <h2>Finalidad</h2>
          <p>
            Los datos se utilizan exclusivamente para evaluar la consulta, coordinar la atención y
            responder a la solicitud recibida. No se emplean con fines publicitarios ni se ceden a
            terceros con finalidad comercial.
          </p>

          <h2>Base legal</h2>
          <p>
            El tratamiento se sustenta en el consentimiento que la persona interesada otorga al
            marcar la casilla correspondiente antes de enviar cada formulario.
          </p>

          <h2>Conservación</h2>
          <p>
            La información se conserva mientras sea necesaria para atender la consulta y, en su
            caso, durante los plazos que exija la normativa aplicable al ejercicio profesional.
          </p>

          <h2>Encargados y seguridad</h2>
          <p>
            El sitio se apoya en proveedores de alojamiento y base de datos que actúan como
            encargados del tratamiento. El acceso a la información está restringido al personal del
            estudio mediante autenticación y políticas de acceso a nivel de base de datos.
          </p>

          <h2>Derechos</h2>
          <p>
            La persona interesada puede solicitar el acceso, la rectificación, la cancelación o la
            oposición al tratamiento de sus datos escribiendo a {settings.email}. La solicitud se
            atiende dentro de los plazos previstos en la normativa de protección de datos
            personales.
          </p>

          <h2>Confidencialidad profesional</h2>
          <p>
            Con independencia de lo anterior, la información recibida se trata con la reserva propia
            del ejercicio profesional de la abogacía.
          </p>
        </div>
      </article>
    </>
  );
}
