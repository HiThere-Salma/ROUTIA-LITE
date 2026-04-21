import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { to, phone, transporteurName, routeDate, mapsLink } = await req.json()

  // 👇 log pour confirmer ce qui arrive
  console.log('Payload reçu:', { to, phone, transporteurName, routeDate })

  const results = await Promise.allSettled([
    // EMAIL
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RoutIA <noreply@adven-consulting.com>',
        to: [to],
        subject: `Votre itinéraire du ${routeDate}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto">
            <h2 style="color:#16a34a">Bonjour ${transporteurName},</h2>
            <p>Votre itinéraire optimisé pour le <strong>${routeDate}</strong> est prêt.</p>
            <a href="${mapsLink}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
              Ouvrir dans Google Maps
            </a>
            <p style="margin-top:24px;color:#6b7280;font-size:13px">RoutIA — Gestion des routes agricoles</p>
          </div>
        `,
      }),
    }),

    // SMS
    phone ? (async () => {
      const tinyRes = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(mapsLink)}`)
      const shortUrl = await tinyRes.text()

      return fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get('TWILIO_ACCOUNT_SID')}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${Deno.env.get('TWILIO_ACCOUNT_SID')}:${Deno.env.get('TWILIO_AUTH_TOKEN')}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: Deno.env.get('TWILIO_PHONE_FROM') ?? '',
            To: phone,
            Body: `RoutIA - Bonjour ${transporteurName}, votre itineraire du ${routeDate} est pret : ${shortUrl}`,
          }),
        }
      ).then(async (res) => {
        const body = await res.json()
        console.log('Twilio status:', res.status)
        console.log('Twilio response:', JSON.stringify(body))
        if (!res.ok) throw new Error(`Twilio ${res.status}: ${body.message}`)
        return res
      })
    })() : Promise.resolve(null),
  ])

  const [emailResult, smsResult] = results
  const errors: string[] = []

  if (emailResult.status === 'rejected') errors.push(`Email: ${emailResult.reason}`)
  if (smsResult.status === 'rejected') errors.push(`SMS: ${smsResult.reason}`)

  return new Response(JSON.stringify({ ok: errors.length === 0, errors }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
})