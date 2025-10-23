import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier la clé API Resend
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY non configurée');
    }

    // Récupérer les données de la requête
    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId est requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les données complètes de la formation
    const { data: formation, error: formationError } = await supabase
      .from('projects')
      .select(`
        *,
        entreprise:entreprise_id(nom, adresse, telephone, email),
        contact:contact_id(id, nom, prenom, email, telephone),
        formateur:formateur_id(id, nom, prenom, email),
        commercial:commercial_id(id, nom, prenom, email),
        pdc:pdc_id(ref, pdc_number, duree_en_jour)
      `)
      .eq('id', projectId)
      .eq('type', 'formation')
      .single();

    if (formationError || !formation) {
      throw new Error(`Formation non trouvée: ${formationError?.message}`);
    }

    // Vérifier que le contact existe
    if (!formation.contact || !formation.contact.email) {
      throw new Error('Contact ou email du contact non trouvé');
    }

    // Vérifier que les PDFs existent
    if (!formation.pdf_convocation || !formation.pdf_convention) {
      throw new Error('Les PDFs de convocation et convention doivent être générés avant l\'envoi');
    }

    // Récupérer les événements/sessions de formation
    const { data: sessions, error: sessionsError } = await supabase
      .from('evenement')
      .select('*')
      .eq('projet_id', projectId)
      .eq('type_evenement', 'formation')
      .order('date_debut', { ascending: true });

    if (sessionsError) {
      console.error('Erreur récupération sessions:', sessionsError);
    }

    // Récupérer les informations des stagiaires
    let stagiairesInfo = [];
    if (formation.stagiaire_ids && formation.stagiaire_ids.length > 0) {
      const { data: stagiaires } = await supabase
        .from('user_profile')
        .select('nom, prenom')
        .in('id', formation.stagiaire_ids);

      if (stagiaires) {
        stagiairesInfo = stagiaires;
      }
    }

    // Télécharger les PDFs
    const [convocationResponse, conventionResponse] = await Promise.all([
      fetch(formation.pdf_convocation),
      fetch(formation.pdf_convention)
    ]);

    if (!convocationResponse.ok || !conventionResponse.ok) {
      throw new Error('Erreur lors du téléchargement des PDFs');
    }

    const convocationBuffer = await convocationResponse.arrayBuffer();
    const conventionBuffer = await conventionResponse.arrayBuffer();

    // Convertir en base64 pour Resend
    const convocationBase64 = btoa(
      new Uint8Array(convocationBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const conventionBase64 = btoa(
      new Uint8Array(conventionBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Formater les dates et lieux avec fuseau horaire Europe/Paris
    const sessionsHtml = sessions && sessions.length > 0
      ? sessions.map((session, index) => {
          const dateDebut = new Date(session.date_debut);
          const dateFin = new Date(session.date_fin);

          // Format de date avec fuseau horaire
          const dateFormatted = dateDebut.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Europe/Paris'
          });

          // Format des heures avec "h" au lieu de ":"
          const heureDebut = dateDebut.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Paris'
          }).replace(':', 'h');

          const heureFin = dateFin.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Paris'
          }).replace(':', 'h');

          return `
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">
                <strong>Session ${index + 1}</strong>
              </td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">
                ${dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)} de ${heureDebut} à ${heureFin}
              </td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">
                ${session.lieu || 'Non spécifié'}<br/>
                ${session.adresse ? `<small style="color: #6b7280;">${session.adresse}</small>` : ''}
              </td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #6b7280;">Aucune session planifiée</td></tr>';

    // Liste des stagiaires
    const stagiairesHtml = stagiairesInfo.length > 0
      ? stagiairesInfo.map(s => `<li style="margin-bottom: 4px;">${s.prenom || ''} ${s.nom || ''}</li>`).join('')
      : '<li style="color: #6b7280;">Aucun stagiaire inscrit</li>';

    // Composer l'email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #133e5e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Formation ARKANCE</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">${formation.prj || 'PRJ non spécifié'}</p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin-top: 0;">Bonjour ${formation.contact.prenom || ''} ${formation.contact.nom || ''},</p>

          <p>Veuillez trouver ci-joint la convocation et la convention concernant la formation suivante :</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h2 style="color: #133e5e; margin-top: 0; font-size: 18px;">${formation.name || 'Formation'}</h2>

            <table style="width: 100%; margin: 15px 0;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;"><strong>Entreprise :</strong></td>
                <td style="padding: 8px 0;">${formation.entreprise?.nom || 'Non spécifié'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Formateur :</strong></td>
                <td style="padding: 8px 0;">${formation.formateur ? `${formation.formateur.prenom || ''} ${formation.formateur.nom || ''}` : 'Non spécifié'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Commercial :</strong></td>
                <td style="padding: 8px 0;">${formation.commercial ? `${formation.commercial.prenom || ''} ${formation.commercial.nom || ''}` : 'Non spécifié'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Plan de cours :</strong></td>
                <td style="padding: 8px 0;">${formation.pdc?.ref || formation.pdc?.pdc_number || 'Non spécifié'}</td>
              </tr>
            </table>

            <h3 style="color: #133e5e; font-size: 16px; margin-top: 20px; margin-bottom: 10px;">Planning des sessions</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Session</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Date et horaires</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; font-weight: 600;">Lieu</th>
                </tr>
              </thead>
              <tbody>
                ${sessionsHtml}
              </tbody>
            </table>

            <h3 style="color: #133e5e; font-size: 16px; margin-top: 20px; margin-bottom: 10px;">Stagiaires inscrits</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${stagiairesHtml}
            </ul>
          </div>

          <p style="margin-bottom: 5px;"><strong>Documents joints :</strong></p>
          <ul style="margin-top: 5px;">
            <li>Convocation de formation</li>
            <li>Convention de formation professionnelle</li>
          </ul>

          <p>Pour toute question, n'hésitez pas à nous contacter.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p style="margin: 5px 0;"><strong>ARKANCE</strong></p>
            <p style="margin: 5px 0;">LE VAL SAINT QUENTIN - Bâtiment C - 2, rue René Caudron - CS 30764</p>
            <p style="margin: 5px 0;">78961 Voisins-le-Bretonneux Cedex</p>
            <p style="margin: 5px 0;">www.arkance.world</p>
            <p style="margin: 5px 0;">Tél. : 01 39 44 18 18</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Envoyer l'email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ARKANCE Formation <noreply@arkance-training.world>',
        to: [formation.contact.email],
        subject: `${formation.name || ''} - ${formation.prj || ''}`,
        html: emailHtml,
        attachments: [
          {
            filename: `convocation_${formation.prj || 'formation'}.pdf`,
            content: convocationBase64
          },
          {
            filename: `convention_${formation.prj || 'formation'}.pdf`,
            content: conventionBase64
          }
        ]
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Erreur Resend: ${JSON.stringify(resendData)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Email envoyé avec succès à ${formation.contact.email}`,
      resendId: resendData.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur dans send-formation-email:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
