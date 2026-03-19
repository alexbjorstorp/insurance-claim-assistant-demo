"""PDF Generation Service for Behandelplan."""
from io import BytesIO
from datetime import datetime
from typing import Dict, Optional
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration


def generate_behandelplan_pdf(
    case_data: Dict,
    behandelplan_data: Dict,
    summaries: Dict[str, str]
) -> bytes:
    """
    Generate a PDF document for a behandelplan.
    
    Args:
        case_data: Dictionary with case information
        behandelplan_data: Dictionary with behandelplan data
        summaries: Dictionary with AI-generated summaries
    
    Returns:
        PDF as bytes
    """
    
    # Extract data
    claimant_name = case_data.get('claimant_name', 'Onbekend')
    case_number = case_data.get('case_number', '')
    claim_amount = case_data.get('claim_amount', 0)
    incident_date = case_data.get('incident_date', '')
    
    # Format dates
    def format_date(date_val):
        if date_val:
            if isinstance(date_val, str):
                return date_val
            return date_val.strftime('%d-%m-%Y')
        return '-'
    
    def format_currency(amount):
        if amount:
            return f"€ {float(amount):,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
        return '€ 0,00'
    
    def format_percentage(pct):
        if pct:
            return f"{float(pct):.0f}%"
        return '-'
    
    def yes_no(value):
        if value is None:
            return '-'
        return "Ja" if value else "Nee"
    
    # Build HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page {{
                size: A4;
                margin: 2cm;
            }}
            
            body {{
                font-family: Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.5;
                color: #333;
            }}
            
            .header {{
                background-color: #1e40af;
                color: white;
                padding: 20px;
                margin-bottom: 30px;
            }}
            
            .header h1 {{
                margin: 0;
                font-size: 24pt;
            }}
            
            .header .subtitle {{
                margin: 5px 0 0 0;
                font-size: 12pt;
                opacity: 0.9;
            }}
            
            .case-info {{
                background-color: #f3f4f6;
                padding: 15px;
                margin-bottom: 20px;
                border-left: 4px solid #1e40af;
            }}
            
            .case-info-grid {{
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }}
            
            .info-item {{
                margin: 5px 0;
            }}
            
            .info-label {{
                font-weight: bold;
                color: #666;
                font-size: 9pt;
            }}
            
            .info-value {{
                font-size: 11pt;
                color: #111;
            }}
            
            .section {{
                margin-bottom: 30px;
                page-break-inside: avoid;
            }}
            
            .section-title {{
                background-color: #1e40af;
                color: white;
                padding: 10px 15px;
                font-size: 14pt;
                font-weight: bold;
                margin-bottom: 15px;
            }}
            
            .summary-box {{
                background-color: #eff6ff;
                border: 1px solid #bfdbfe;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }}
            
            .summary-box h4 {{
                margin: 0 0 10px 0;
                color: #1e40af;
                font-size: 11pt;
            }}
            
            .summary-text {{
                line-height: 1.6;
                color: #374151;
            }}
            
            .data-table {{
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }}
            
            .data-table th {{
                background-color: #f3f4f6;
                padding: 10px;
                text-align: left;
                font-weight: bold;
                border-bottom: 2px solid #d1d5db;
                font-size: 10pt;
            }}
            
            .data-table td {{
                padding: 8px 10px;
                border-bottom: 1px solid #e5e7eb;
                vertical-align: top;
            }}
            
            .data-table tr:last-child td {{
                border-bottom: none;
            }}
            
            .field-label {{
                font-weight: bold;
                color: #6b7280;
                width: 40%;
            }}
            
            .field-value {{
                color: #111827;
            }}
            
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
                font-size: 9pt;
                color: #6b7280;
                text-align: center;
            }}
            
            .page-break {{
                page-break-after: always;
            }}
        </style>
    </head>
    <body>
        <!-- Header -->
        <div class="header">
            <h1>Behandelplan</h1>
            <div class="subtitle">Letselschade Dossier {case_number}</div>
        </div>
        
        <!-- Case Information -->
        <div class="case-info">
            <div class="case-info-grid">
                <div class="info-item">
                    <div class="info-label">Slachtoffer</div>
                    <div class="info-value">{claimant_name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Dossiernummer</div>
                    <div class="info-value">{case_number}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Incident datum</div>
                    <div class="info-value">{format_date(incident_date)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Schadelast</div>
                    <div class="info-value">{format_currency(claim_amount)}</div>
                </div>
            </div>
        </div>
        
        <!-- Overall Summary -->
        {f'''
        <div class="summary-box">
            <h4>Algehele Samenvatting</h4>
            <div class="summary-text">{summaries.get('ai_summary_overall', 'Geen samenvatting beschikbaar.')}</div>
        </div>
        ''' if summaries.get('ai_summary_overall') else ''}
        
        <!-- Dossierverloop Section -->
        <div class="section">
            <div class="section-title">1. Dossierverloop</div>
            
            {f'''
            <div class="summary-box">
                <h4>Samenvatting</h4>
                <div class="summary-text">{summaries.get('ai_summary_dossierverloop', '')}</div>
            </div>
            ''' if summaries.get('ai_summary_dossierverloop') else ''}
            
            <table class="data-table">
                <tr>
                    <td class="field-label">Toedracht</td>
                    <td class="field-value">{behandelplan_data.get('toedracht', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Causaliteitsvraag</td>
                    <td class="field-value">{behandelplan_data.get('causaliteitsvraag', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Dekking</td>
                    <td class="field-value">{yes_no(behandelplan_data.get('dekking'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Percentage aansprakelijkheid</td>
                    <td class="field-value">{format_percentage(behandelplan_data.get('percentage_aansprakelijkheid'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Datum aansprakelijkheid</td>
                    <td class="field-value">{format_date(behandelplan_data.get('datum_aansprakelijkheid'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Percentage eigen schuld</td>
                    <td class="field-value">{format_percentage(behandelplan_data.get('percentage_eigen_schuld'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Regres mogelijk</td>
                    <td class="field-value">{yes_no(behandelplan_data.get('regres_mogelijk'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Alle-of-niets dossier</td>
                    <td class="field-value">{yes_no(behandelplan_data.get('alle_of_niets_dossier'))}</td>
                </tr>
            </table>
        </div>
        
        <!-- Medical Section -->
        <div class="section">
            <div class="section-title">2. Medische Informatie</div>
            
            {f'''
            <div class="summary-box">
                <h4>Samenvatting</h4>
                <div class="summary-text">{summaries.get('ai_summary_medisch', '')}</div>
            </div>
            ''' if summaries.get('ai_summary_medisch') else ''}
            
            <table class="data-table">
                <tr>
                    <td class="field-label">Letselsoort</td>
                    <td class="field-value">{behandelplan_data.get('letselsoort', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Letselspecificatie</td>
                    <td class="field-value">{behandelplan_data.get('letselspecificatie', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Letsel zijde</td>
                    <td class="field-value">{behandelplan_data.get('letsel_zijde', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Dominante zijde beïnvloedt</td>
                    <td class="field-value">{yes_no(behandelplan_data.get('dominante_zijde_beinvloedt'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Klachten</td>
                    <td class="field-value">{behandelplan_data.get('klachten', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Diagnose</td>
                    <td class="field-value">{behandelplan_data.get('diagnose', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Beperkingen</td>
                    <td class="field-value">{behandelplan_data.get('beperkingen', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Pre-existente bijzonderheden</td>
                    <td class="field-value">{yes_no(behandelplan_data.get('bijzonderheden_pre_existente'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Hersteld</td>
                    <td class="field-value">{yes_no(behandelplan_data.get('hersteld'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Datum eindsituatie bereikt</td>
                    <td class="field-value">{format_date(behandelplan_data.get('datum_eindsituatie'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Medisch advies</td>
                    <td class="field-value">{behandelplan_data.get('medisch_advies', '-')}</td>
                </tr>
            </table>
        </div>
        
        <div class="page-break"></div>
        
        <!-- Work Section -->
        <div class="section">
            <div class="section-title">3. Arbeidsongeschiktheid & Werk</div>
            
            {f'''
            <div class="summary-box">
                <h4>Samenvatting</h4>
                <div class="summary-text">{summaries.get('ai_summary_arbeid', '')}</div>
            </div>
            ''' if summaries.get('ai_summary_arbeid') else ''}
            
            <table class="data-table">
                <tr>
                    <td class="field-label">Beroep</td>
                    <td class="field-value">{behandelplan_data.get('beroep', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Dienstverband</td>
                    <td class="field-value">{behandelplan_data.get('dienstverband', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Omvang dienstverband</td>
                    <td class="field-value">{behandelplan_data.get('omvang_dienstverband', '-')} uur/week</td>
                </tr>
                <tr>
                    <td class="field-label">Netto inkomen</td>
                    <td class="field-value">{format_currency(behandelplan_data.get('netto_inkomen'))} per maand</td>
                </tr>
                <tr>
                    <td class="field-label">Nu arbeidsongeschikt</td>
                    <td class="field-value">{yes_no(behandelplan_data.get('nu_arbeidsongeschikt'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Percentage arbeidsongeschikt</td>
                    <td class="field-value">{format_percentage(behandelplan_data.get('percentage_arbeidsongeschikt'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Startdatum arbeidsongeschiktheid</td>
                    <td class="field-value">{format_date(behandelplan_data.get('arbeidsongeschiktheid_startdatum'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Einddatum arbeidsongeschiktheid</td>
                    <td class="field-value">{format_date(behandelplan_data.get('arbeidsongeschiktheid_einddatum'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Interventies</td>
                    <td class="field-value">{behandelplan_data.get('interventies', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Prognose</td>
                    <td class="field-value">{behandelplan_data.get('prognose', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Overweging</td>
                    <td class="field-value">{behandelplan_data.get('arbeid_overweging', '-')}</td>
                </tr>
            </table>
        </div>
        
        <!-- Social Section -->
        <div class="section">
            <div class="section-title">4. Privésituatie & Sociale Omstandigheden</div>
            
            {f'''
            <div class="summary-box">
                <h4>Samenvatting</h4>
                <div class="summary-text">{summaries.get('ai_summary_sociaal', '')}</div>
            </div>
            ''' if summaries.get('ai_summary_sociaal') else ''}
            
            <table class="data-table">
                <tr>
                    <td class="field-label">Samenstelling huishouden</td>
                    <td class="field-value">{behandelplan_data.get('samenstelling_huishouden', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Aantal kinderen</td>
                    <td class="field-value">{behandelplan_data.get('aantal_kinderen', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Aandeel huishoudelijke taken</td>
                    <td class="field-value">{format_percentage(behandelplan_data.get('aandeel_huishoudelijke_taken'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Aandeel zelfwerkzaamheid</td>
                    <td class="field-value">{format_percentage(behandelplan_data.get('aandeel_zelfwerkzaamheid'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Nu beperkt</td>
                    <td class="field-value">{yes_no(behandelplan_data.get('nu_beperkt'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Startdatum</td>
                    <td class="field-value">{format_date(behandelplan_data.get('sociaal_startdatum'))}</td>
                </tr>
                <tr>
                    <td class="field-label">Overweging</td>
                    <td class="field-value">{behandelplan_data.get('sociaal_overweging', '-')}</td>
                </tr>
            </table>
        </div>
        
        <!-- Strategy Section -->
        <div class="section">
            <div class="section-title">5. Strategie & Scenario</div>
            
            {f'''
            <div class="summary-box">
                <h4>Samenvatting</h4>
                <div class="summary-text">{summaries.get('ai_summary_strategie', '')}</div>
            </div>
            ''' if summaries.get('ai_summary_strategie') else ''}
            
            <table class="data-table">
                <tr>
                    <td class="field-label">Reden lopend dossier</td>
                    <td class="field-value">{behandelplan_data.get('reden_lopend_dossier', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Oplossingsrichting</td>
                    <td class="field-value">{behandelplan_data.get('oplossingsrichting', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Scenarios</td>
                    <td class="field-value">{behandelplan_data.get('scenarios', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Vervolgstappen</td>
                    <td class="field-value">{behandelplan_data.get('vervolgstappen', '-')}</td>
                </tr>
                <tr>
                    <td class="field-label">Motivering</td>
                    <td class="field-value">{behandelplan_data.get('motivering', '-')}</td>
                </tr>
            </table>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>Dit document is gegenereerd op {datetime.now().strftime('%d-%m-%Y om %H:%M')} uur</p>
            <p>EYE on Claims - Letselschade Management Systeem</p>
        </div>
    </body>
    </html>
    """
    
    # Generate PDF
    font_config = FontConfiguration()
    html = HTML(string=html_content)
    pdf_bytes = html.write_pdf(font_config=font_config)
    
    return pdf_bytes
