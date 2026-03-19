"""LLM Service for generating summaries of behandelplan sections."""
import os
from typing import Dict, Optional
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


def generate_section_summary(section_name: str, section_data: Dict[str, any], case_info: Dict[str, any]) -> str:
    """
    Generate a concise Dutch summary of a behandelplan section using LLM.
    
    Args:
        section_name: Name of the section (dossierverloop, medisch, arbeid, sociaal, strategie)
        section_data: Dictionary containing the section's field data
        case_info: Dictionary with case information (claimant_name, case_number, claim_amount, etc.)
    
    Returns:
        Dutch summary text (max 200 words)
    """
    
    # Format the data for the prompt
    data_text = "\n".join([f"{k}: {v}" for k, v in section_data.items() if v is not None])
    
    prompts = {
        "dossierverloop": f"""
Schrijf een beknopte Nederlandse samenvatting (max 150 woorden) van het dossierverloop voor letselschade dossier {case_info.get('case_number')}.

Slachtoffer: {case_info.get('claimant_name')}
Schadelast: €{case_info.get('claim_amount', 0):,.2f}

Details:
{data_text}

Samenvatting moet bevatten: toedracht, aansprakelijkheid, dekking en belangrijkste conclusies.
""",
        "medisch": f"""
Schrijf een beknopte Nederlandse samenvatting (max 150 woorden) van de medische situatie voor {case_info.get('claimant_name')}.

Details:
{data_text}

Samenvatting moet bevatten: letselsoort, diagnose, klachten, behandeling en herstelstatus.
""",
        "arbeid": f"""
Schrijf een beknopte Nederlandse samenvatting (max 150 woorden) van de arbeidssituatie voor {case_info.get('claimant_name')}.

Details:
{data_text}

Samenvatting moet bevatten: beroep, arbeidsongeschiktheid, prognose en re-integratie.
""",
        "sociaal": f"""
Schrijf een beknopte Nederlandse samenvatting (max 100 woorden) van de privésituatie voor {case_info.get('claimant_name')}.

Details:
{data_text}

Samenvatting moet bevatten: huishouden, impact op dagelijks leven en beperkingen.
""",
        "strategie": f"""
Schrijf een beknopte Nederlandse samenvatting (max 150 woorden) van de strategie en scenario's voor dossier {case_info.get('case_number')}.

Details:
{data_text}

Samenvatting moet bevatten: reden lopend dossier, oplossingsrichting en vervolgstappen.
"""
    }
    
    prompt = prompts.get(section_name, "")
    if not prompt:
        return ""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Je bent een expert in het samenvatten van letselschade dossiers in helder Nederlands. Schrijf professioneel, beknopt en feitelijk. Gebruik GEEN markdown opmaak (geen *, **, _). Schrijf in platte tekst."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating summary for {section_name}: {e}")
        return f"Samenvatting kon niet worden gegenereerd: {str(e)}"


def generate_overall_summary(all_summaries: Dict[str, str], case_info: Dict[str, any]) -> str:
    """
    Generate an overall summary combining all section summaries.
    
    Args:
        all_summaries: Dictionary with section summaries
        case_info: Dictionary with case information
    
    Returns:
        Overall Dutch summary (max 250 words)
    """
    
    combined_text = "\n\n".join([
        f"**{section.upper()}**\n{summary}"
        for section, summary in all_summaries.items()
        if summary
    ])
    
    prompt = f"""
Schrijf een beknopte algehele samenvatting (max 250 woorden) voor letselschade dossier {case_info.get('case_number')}.

Slachtoffer: {case_info.get('claimant_name')}
Schadelast: €{case_info.get('claim_amount', 0):,.2f}
Status: {case_info.get('status', 'in_progress')}

Secties:
{combined_text}

De samenvatting moet een compleet overzicht geven van het dossier, geschikt voor directe besluitvorming.
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Je bent een expert in het samenvatten van letselschade dossiers. Schrijf een heldere, professionele samenvatting die alle belangrijke aspecten bevat. Gebruik GEEN markdown opmaak (geen *, **, _). Schrijf in platte tekst."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error generating overall summary: {e}")
        return f"Algehele samenvatting kon niet worden gegenereerd: {str(e)}"


def generate_all_summaries(behandelplan_data: Dict[str, any], case_info: Dict[str, any]) -> Dict[str, str]:
    """
    Generate all summaries for a behandelplan.
    
    Args:
        behandelplan_data: Complete behandelplan data
        case_info: Case information
    
    Returns:
        Dictionary with all generated summaries
    """
    
    # Extract section data
    sections = {
        "dossierverloop": {k: v for k, v in behandelplan_data.items() 
                          if k in ['toedracht', 'causaliteitsvraag', 'dekking', 'percentage_aansprakelijkheid', 
                                   'datum_aansprakelijkheid', 'percentage_eigen_schuld', 'regres_mogelijk', 'alle_of_niets_dossier']},
        "medisch": {k: v for k, v in behandelplan_data.items()
                   if k in ['letselsoort', 'letselspecificatie', 'letsel_zijde', 'dominante_zijde_beinvloedt',
                            'klachten', 'diagnose', 'beperkingen', 'bijzonderheden_pre_existente', 
                            'hersteld', 'datum_eindsituatie', 'medisch_advies']},
        "arbeid": {k: v for k, v in behandelplan_data.items()
                  if k in ['beroep', 'dienstverband', 'omvang_dienstverband', 'netto_inkomen',
                           'nu_arbeidsongeschikt', 'percentage_arbeidsongeschikt', 'arbeidsongeschiktheid_startdatum',
                           'arbeidsongeschiktheid_einddatum', 'interventies', 'prognose', 'arbeid_overweging']},
        "sociaal": {k: v for k, v in behandelplan_data.items()
                   if k in ['samenstelling_huishouden', 'aantal_kinderen', 'aandeel_huishoudelijke_taken',
                            'aandeel_zelfwerkzaamheid', 'nu_beperkt', 'sociaal_startdatum', 'sociaal_overweging']},
        "strategie": {k: v for k, v in behandelplan_data.items()
                     if k in ['reden_lopend_dossier', 'oplossingsrichting', 'scenarios', 'vervolgstappen', 'motivering']}
    }
    
    # Generate section summaries
    summaries = {}
    for section_name, section_data in sections.items():
        print(f"Generating summary for {section_name}...")
        summaries[f"ai_summary_{section_name}"] = generate_section_summary(section_name, section_data, case_info)
    
    # Generate overall summary
    print("Generating overall summary...")
    summaries["ai_summary_overall"] = generate_overall_summary(summaries, case_info)
    
    return summaries
