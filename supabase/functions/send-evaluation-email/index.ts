import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Générer le HTML pour une question
function renderQuestion(label: string, note: number | null): string {
  // Si la question n'a pas été posée (null), ne pas l'afficher
  if (note === null) return '';

  return `
    <tr>
      <td style="padding: 8px 12px; color: #374151; border-bottom: 1px solid #e5e7eb;">${label}</td>
      <td style="padding: 8px 12px; font-weight: 600; color: #1f2937; text-align: right; border-bottom: 1px solid #e5e7eb;">${note}/5</td>
    </tr>
  `;
}

// Helper: Générer le HTML pour un champ texte/commentaires
function renderTextField(label: string, value: string | null): string {
  if (!value || value.trim() === '') return '';

  return `
    <tr>
      <td colspan="2" style="padding: 12px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
        <strong style="color: #6b7280; font-size: 13px;">💬 ${label} :</strong>
        <p style="margin: 5px 0 0 0; color: #374151; font-size: 14px; line-height: 1.5;">${value}</p>
      </td>
    </tr>
  `;
}

// Helper: Générer le HTML d'une section complète
function renderSection(title: string, questions: string): string {
  return `
    <div style="margin-bottom: 24px;">
      <h3 style="color: #133e5e; font-size: 16px; font-weight: bold; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #133e5e;">
        ${title}
      </h3>
      <table style="width: 100%; border-collapse: collapse; background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        ${questions}
      </table>
    </div>
  `;
}

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
    const { evaluationId } = await req.json();

    if (!evaluationId) {
      return new Response(JSON.stringify({ error: 'evaluationId est requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les données complètes de l'évaluation
    const { data: evaluation, error: evaluationError } = await supabase
      .from('evaluation')
      .select(`
        *,
        formation:formation_id(
          name,
          prj,
          pdc:pdc_id(ref, pdc_number),
          formateur:formateur_id(nom, prenom)
        )
      `)
      .eq('id', evaluationId)
      .single();

    if (evaluationError || !evaluation) {
      throw new Error(`Évaluation non trouvée: ${evaluationError?.message}`);
    }

    // Vérifier que le stagiaire a un email
    if (!evaluation.stagiaire_email) {
      throw new Error('Email du stagiaire non trouvé');
    }

    // Vérifier que les 2 PDFs existent
    if (!evaluation.pdf_qualiopi_url) {
      throw new Error('Le PDF Qualiopi doit être généré avant l\'envoi');
    }
    if (!evaluation.pdf_diplome_url) {
      throw new Error('Le PDF Diplôme doit être généré avant l\'envoi');
    }

    console.log('📥 Téléchargement des PDFs...');

    // Télécharger le PDF Qualiopi
    const pdfQualiopiResponse = await fetch(evaluation.pdf_qualiopi_url);
    if (!pdfQualiopiResponse.ok) {
      throw new Error('Erreur lors du téléchargement du PDF Qualiopi');
    }
    const pdfQualiopiBuffer = await pdfQualiopiResponse.arrayBuffer();
    const pdfQualiopiBase64 = btoa(
      new Uint8Array(pdfQualiopiBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Télécharger le PDF Diplôme
    const pdfDiplomeResponse = await fetch(evaluation.pdf_diplome_url);
    if (!pdfDiplomeResponse.ok) {
      throw new Error('Erreur lors du téléchargement du PDF Diplôme');
    }
    const pdfDiplomeBuffer = await pdfDiplomeResponse.arrayBuffer();
    const pdfDiplomeBase64 = btoa(
      new Uint8Array(pdfDiplomeBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    console.log('✅ PDFs téléchargés et encodés en base64');

    // === GÉNÉRER LE RÉSUMÉ D'ÉVALUATION ===

    // Section 01: Organisation
    const section01 = renderSection('01 - ORGANISATION', `
      ${renderQuestion('Communication sur les objectifs de la formation', evaluation.org_communication_objectifs)}
      ${renderQuestion('Durée de la formation', evaluation.org_duree_formation)}
      ${renderQuestion('Composition du groupe (nombre et niveau)', evaluation.org_composition_groupe)}
      ${renderQuestion('Respect des engagements de démarrage et de fin de session', evaluation.org_respect_engagements)}
      ${renderTextField('Commentaires', evaluation.org_commentaires)}
    `);

    // Section 02: Moyens
    const section02 = renderSection('02 - MOYENS PÉDAGOGIQUES ET TECHNIQUES', `
      ${renderQuestion('Évaluation des locaux', evaluation.moyens_evaluation_locaux)}
      ${renderQuestion('Matériel informatique et multimédia mis à disposition', evaluation.moyens_materiel_informatique)}
      ${renderQuestion('Qualité de la formation à distance (Teams, outils...)', evaluation.moyens_formation_distance)}
      ${renderQuestion('Supports de cours', evaluation.moyens_support_cours)}
      ${renderTextField('Lieu des repas', evaluation.moyens_lieu_repas)}
      ${renderQuestion('La restauration', evaluation.moyens_restauration)}
    `);

    // Section 03: Pédagogie
    const section03 = renderSection('03 - PÉDAGOGIE', `
      ${renderQuestion('Niveau de difficulté du programme', evaluation.peda_niveau_difficulte)}
      ${renderQuestion('Rythme de progression du programme', evaluation.peda_rythme_progression)}
      ${renderQuestion('Qualité du contenu théorique', evaluation.peda_qualite_contenu_theorique)}
      ${renderQuestion('Qualité du contenu pratique (exercices, cas pratiques)', evaluation.peda_qualite_contenu_pratique)}
      ${renderQuestion('Connaissance du sujet par le formateur', evaluation.peda_connaissance_formateur)}
      ${renderQuestion('Approche pédagogique', evaluation.peda_approche_pedagogique)}
      ${renderQuestion('Écoute et disponibilité du formateur', evaluation.peda_ecoute_disponibilite)}
      ${renderQuestion('Animation générale de la formation par le formateur', evaluation.peda_animation_formateur)}
      ${renderTextField('Commentaires', evaluation.peda_commentaires)}
    `);

    // Section 04: Satisfaction
    const besoinsComplementaires = [];
    if (evaluation.satisf_besoin_formation_complementaire) {
      const logiciel = evaluation.satisf_logiciel_complementaire || 'Non précisé';
      besoinsComplementaires.push(`Formation complémentaire souhaitée : ${logiciel}`);
    }
    if (evaluation.satisf_besoin_accompagnement) {
      const precision = evaluation.satisf_precision_besoins || 'Non précisé';
      besoinsComplementaires.push(`Accompagnement souhaité : ${precision}`);
    }
    const besoinsHtml = besoinsComplementaires.length > 0
      ? renderTextField('Besoins complémentaires', besoinsComplementaires.join(' | '))
      : '';

    const section04 = renderSection('04 - SATISFACTION GLOBALE', `
      ${renderQuestion('Cette formation a-t-elle répondu à vos attentes ?', evaluation.satisf_repondu_attentes)}
      ${renderQuestion('Avez-vous atteint les objectifs de cette formation ?', evaluation.satisf_atteint_objectifs)}
      ${renderQuestion('Adéquation de la formation par rapport à votre métier', evaluation.satisf_adequation_metier)}
      ${renderQuestion('Recommanderiez-vous cette formation ?', evaluation.satisf_recommandation)}
      ${renderQuestion('Niveau de satisfaction global', evaluation.satisf_niveau_global)}
      ${renderTextField('Commentaires', evaluation.satisf_commentaires)}
      ${besoinsHtml}
    `);

    // Composer l'email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f3f4f6;">
        <div style="background-color: #133e5e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Merci pour votre évaluation</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Formation ARKANCE</p>
        </div>

        <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin-top: 0;">Bonjour ${evaluation.stagiaire_prenom || ''} ${evaluation.stagiaire_nom || ''},</p>

          <p>Nous vous remercions d'avoir pris le temps de remplir l'évaluation de la formation suivante :</p>

          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #133e5e;">
            <h2 style="color: #133e5e; margin-top: 0; font-size: 18px;">${evaluation.formation?.name || 'Formation'}</h2>

            <table style="width: 100%; margin: 15px 0; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 140px;"><strong>Référence :</strong></td>
                <td style="padding: 8px 0;">${evaluation.formation?.prj || 'Non spécifié'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Formateur :</strong></td>
                <td style="padding: 8px 0;">${evaluation.formation?.formateur ? `${evaluation.formation.formateur.prenom || ''} ${evaluation.formation.formateur.nom || ''}` : 'Non spécifié'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;"><strong>Plan de cours :</strong></td>
                <td style="padding: 8px 0;">${evaluation.formation?.pdc?.ref || evaluation.formation?.pdc?.pdc_number || 'Non spécifié'}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h2 style="color: #133e5e; margin-top: 0; font-size: 20px; border-bottom: 3px solid #133e5e; padding-bottom: 10px;">
              📊 Résumé de votre évaluation
            </h2>

            ${section01}
            ${section02}
            ${section03}
            ${section04}
          </div>

          <p>Votre retour est précieux et nous permet d'améliorer continuellement la qualité de nos formations.</p>

          <p style="margin-bottom: 5px;"><strong>Documents joints :</strong></p>
          <ul style="margin-top: 5px;">
            <li>Évaluation Qualiopi (PDF)</li>
            <li>Diplôme de Formation (PDF)</li>
          </ul>

          <p>Nous vous remercions pour votre confiance et espérons vous revoir prochainement.</p>

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

    // Créer les noms de fichiers PDF
    const fileNameQualiopi = `Evaluation_Qualiopi_${evaluation.stagiaire_nom}_${evaluation.stagiaire_prenom}.pdf`;
    const fileNameDiplome = `Diplome_Formation_${evaluation.stagiaire_nom}_${evaluation.stagiaire_prenom}.pdf`;

    console.log('📧 Envoi de l\'email via Resend...');

    // Envoyer l'email via Resend avec les 2 PDFs
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ARKANCE Formation <noreply@arkance-training.world>',
        to: [
          evaluation.stagiaire_email,
          'franck.delcuse@arkance.world',
          'adrien.kapper@arkance.world'
        ],
        subject: `Merci pour votre évaluation - ${evaluation.formation?.name || 'Formation'}`,
        html: emailHtml,
        attachments: [
          {
            filename: fileNameQualiopi,
            content: pdfQualiopiBase64,
          },
          {
            filename: fileNameDiplome,
            content: pdfDiplomeBase64,
          },
        ],
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(`Erreur Resend: ${JSON.stringify(resendData)}`);
    }

    console.log('✅ Email envoyé avec succès');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email envoyé avec succès à ${evaluation.stagiaire_email}`,
        resendId: resendData.id,
        attachments: [
          { filename: fileNameQualiopi, type: 'Qualiopi' },
          { filename: fileNameDiplome, type: 'Diplôme' },
        ],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Erreur dans send-evaluation-email:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
