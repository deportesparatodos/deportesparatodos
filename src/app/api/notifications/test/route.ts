
import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';

const generateEmailHtml = (categoryCount: number) => {
    let detailsHtml = `
      <p style="margin-bottom: 20px;">Este es un ejemplo de cómo recibirás tus notificaciones diarias. Has seleccionado ${categoryCount} categoría(s).</p>
      <p>Debido a que no tenemos una base de datos central, no podemos mostrarte los eventos específicos de hoy en este correo de prueba.</p>
    `;
    
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #333; text-align: center;">Notificación de Prueba - Deportes para Todos</h1>
            ${detailsHtml}
            <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
                Para dejar de recibir estas notificaciones, gestiona tus suscripciones en la web.
            </p>
        </div>
    `;
};


export async function POST(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await request.json();
    const { email, subscribedCategories } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!subscribedCategories) {
      return NextResponse.json({ error: 'subscribedCategories is required' }, { status: 400 });
    }

    const categoryCount = subscribedCategories.includes('all') ? 'todas' : subscribedCategories.length;
    const emailHtml = generateEmailHtml(subscribedCategories.length);

    await resend.emails.send({
      from: 'Deportes para Todos <onboarding@resend.dev>',
      to: email,
      subject: `🔔 Notificación de Prueba de Deportes para Todos`,
      html: emailHtml,
    });

    return NextResponse.json({ message: 'Test notification sent successfully' });

  } catch (error: any) {
    console.error('TEST_NOTIFICATION Error:', error);
    // Try to provide a more specific error message if available
    const errorMessage = error.message || 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
