"""HTML Generation Service for Behandelplan."""
from datetime import datetime
from typing import Dict


def generate_behandelplan_html(
    case_data: Dict,
    behandelplan_data: Dict,
    summaries: Dict[str, str],
    dark_mode: bool = False
) -> str:
    """
    Generate an HTML document for a behandelplan.
    
    Args:
        case_data: Dictionary with case information
        behandelplan_data: Dictionary with behandelplan data
        summaries: Dictionary with AI-generated summaries
        dark_mode: Whether to use dark mode styling
    
    Returns:
        HTML as string
    """
    
    # Extract data
    claimant_name = case_data.get('claimant_name', 'Onbekend')
    case_number = case_data.get('case_number', '')
    claim_amount = case_data.get('claim_amount', 0)
    incident_date = case_data.get('incident_date', '')
    
    # Helper functions
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
    dark_class = 'dark-mode' if dark_mode else ''
    
    html_content = f"""
    <!DOCTYPE html>
    <html class="{dark_class}">
    <head>
        <meta charset="UTF-8">
        <style>
            :root {{
                --bg-primary: #f9fafb;
                --bg-secondary: white;
                --bg-tertiary: #f9fafb;
                --bg-hover: #f3f4f6;
                --text-primary: #1f2937;
                --text-secondary: #6b7280;
                --text-tertiary: #111827;
                --border-color: #e5e7eb;
                --shadow: rgba(0, 0, 0, 0.1);
                --blue-gradient-start: #2563eb;
                --blue-gradient-end: #1e40af;
                --info-bg: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                --summary-bg: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                --summary-text: #1e3a8a;
                --overall-bg: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                --overall-border: #f59e0b;
                --overall-text: #451a03;
                --overall-heading: #92400e;
            }}
            
            .dark-mode {{
                --bg-primary: #111827;
                --bg-secondary: #1f2937;
                --bg-tertiary: #374151;
                --bg-hover: #4b5563;
                --text-primary: #f9fafb;
                --text-secondary: #9ca3af;
                --text-tertiary: #f3f4f6;
                --border-color: #374151;
                --shadow: rgba(0, 0, 0, 0.3);
                --blue-gradient-start: #1e40af;
                --blue-gradient-end: #1e3a8a;
                --info-bg: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                --summary-bg: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                --summary-text: #dbeafe;
                --overall-bg: linear-gradient(135deg, #78350f 0%, #92400e 100%);
                --overall-border: #f59e0b;
                --overall-text: #fef3c7;
                --overall-heading: #fde68a;
            }}
            
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: var(--text-primary);
                background: var(--bg-primary);
                padding: 40px 20px;
                transition: background-color 0.3s, color 0.3s;
            }}
            
            .container {{
                max-width: 1000px;
                margin: 0 auto;
                background: var(--bg-secondary);
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px var(--shadow), 0 2px 4px -1px var(--shadow);
                overflow: hidden;
            }}
            
            .header {{
                background: linear-gradient(135deg, var(--blue-gradient-start) 0%, var(--blue-gradient-end) 100%);
                color: white;
                padding: 48px 48px 40px;
                position: relative;
            }}
            
            .header::after {{
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
            }}
            
            .header h1 {{
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 8px;
                letter-spacing: -0.5px;
            }}
            
            .header .subtitle {{
                font-size: 16px;
                opacity: 0.9;
                font-weight: 400;
            }}
            
            .content {{
                padding: 48px;
            }}
            
            .case-info {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 24px;
                padding: 32px;
                background: var(--info-bg);
                border-radius: 12px;
                margin-bottom: 48px;
            }}
            
            .info-item {{
                display: flex;
                flex-direction: column;
                gap: 6px;
            }}
            
            .info-label {{
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--text-secondary);
            }}
            
            .info-value {{
                font-size: 16px;
                font-weight: 600;
                color: var(--text-tertiary);
            }}
            
            .overall-summary {{
                background: var(--overall-bg);
                border-radius: 12px;
                padding: 32px;
                margin-bottom: 48px;
                border-left: 4px solid var(--overall-border);
            }}
            
            .overall-summary h2 {{
                font-size: 20px;
                font-weight: 700;
                color: var(--overall-heading);
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }}
            
            .overall-summary p {{
                color: var(--overall-text);
                white-space: pre-wrap;
                line-height: 1.8;
                font-size: 15px;
            }}
            
            .section {{
                margin-bottom: 48px;
                page-break-inside: avoid;
            }}
            
            .section-header {{
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 24px;
                padding-bottom: 12px;
                border-bottom: 2px solid var(--border-color);
            }}
            
            .section-number {{
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, var(--blue-gradient-start) 0%, var(--blue-gradient-end) 100%);
                color: white;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 18px;
                flex-shrink: 0;
            }}
            
            .section-title {{
                font-size: 22px;
                font-weight: 700;
                color: var(--text-tertiary);
            }}
            
            .summary-box {{
                background: var(--summary-bg);
                border-radius: 10px;
                padding: 24px;
                margin-bottom: 28px;
                border-left: 4px solid var(--blue-gradient-start);
            }}
            
            .summary-box h3 {{
                font-size: 14px;
                font-weight: 700;
                color: var(--overall-heading);
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            
            .summary-box p {{
                color: var(--summary-text);
                white-space: pre-wrap;
                line-height: 1.7;
                font-size: 14px;
            }}
            
            .data-grid {{
                display: grid;
                gap: 20px;
                margin-bottom: 24px;
            }}
            
            .data-row {{
                display: grid;
                grid-template-columns: 200px 1fr;
                gap: 16px;
                padding: 16px;
                background: var(--bg-tertiary);
                border-radius: 8px;
                transition: background 0.2s;
            }}
            
            .data-row:hover {{
                background: var(--bg-hover);
            }}
            
            .data-label {{
                font-size: 13px;
                font-weight: 600;
                color: var(--text-secondary);
            }}
            
            .data-value {{
                font-size: 14px;
                color: var(--text-tertiary);
                word-wrap: break-word;
            }}
            
            @media print {{
                body {{
                    background: white;
                    padding: 0;
                }}
                
                .container {{
                    box-shadow: none;
                }}
                
                .section {{
                    page-break-inside: avoid;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Behandelplan</h1>
                <div class="subtitle">Gedetailleerd overzicht schadebehandeling</div>
            </div>
            
            <div class="content">
                <div class="case-info">
                    <div class="info-item">
                        <div class="info-label">Zaaknummer</div>
                        <div class="info-value">{case_number}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Benadeelde</div>
                        <div class="info-value">{claimant_name}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Schadelast</div>
                        <div class="info-value">{format_currency(claim_amount)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Incident datum</div>
                        <div class="info-value">{format_date(incident_date)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Rapportage datum</div>
                        <div class="info-value">{datetime.now().strftime('%d-%m-%Y')}</div>
                    </div>
                </div>
"""
    
    # Overall Summary (if available)
    if summaries.get('ai_summary_overall'):
        html_content += f"""
                <div class="overall-summary">
                    <h2>📋 Algemene Samenvatting</h2>
                    <p>{summaries['ai_summary_overall']}</p>
                </div>
"""
    
    # Section 1: Dossierverloop
    html_content += """
                <div class="section">
                    <div class="section-header">
                        <div class="section-number">1</div>
                        <div class="section-title">Dossierverloop</div>
                    </div>
"""
    
    if summaries.get('ai_summary_dossierverloop'):
        html_content += f"""
                    <div class="summary-box">
                        <h3>AI Samenvatting</h3>
                        <p>{summaries['ai_summary_dossierverloop']}</p>
                    </div>
"""
    
    html_content += f"""
                    <div class="data-grid">
                        <div class="data-row">
                            <div class="data-label">Toedracht</div>
                            <div class="data-value">{behandelplan_data.get('toedracht') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Causaliteitsvraag</div>
                            <div class="data-value">{behandelplan_data.get('causaliteitsvraag') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Dekking</div>
                            <div class="data-value">{yes_no(behandelplan_data.get('dekking'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Aansprakelijkheid %</div>
                            <div class="data-value">{format_percentage(behandelplan_data.get('percentage_aansprakelijkheid'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Datum aansprakelijkheid</div>
                            <div class="data-value">{format_date(behandelplan_data.get('datum_aansprakelijkheid'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Eigen schuld %</div>
                            <div class="data-value">{format_percentage(behandelplan_data.get('percentage_eigen_schuld'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Regres mogelijk</div>
                            <div class="data-value">{yes_no(behandelplan_data.get('regres_mogelijk'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Alles-of-niets dossier</div>
                            <div class="data-value">{yes_no(behandelplan_data.get('alle_of_niets_dossier'))}</div>
                        </div>
                    </div>
                </div>
"""
    
    # Section 2: Medische Informatie
    html_content += """
                <div class="section">
                    <div class="section-header">
                        <div class="section-number">2</div>
                        <div class="section-title">Medische Informatie</div>
                    </div>
"""
    
    if summaries.get('ai_summary_medisch'):
        html_content += f"""
                    <div class="summary-box">
                        <h3>AI Samenvatting</h3>
                        <p>{summaries['ai_summary_medisch']}</p>
                    </div>
"""
    
    html_content += f"""
                    <div class="data-grid">
                        <div class="data-row">
                            <div class="data-label">Letselsoort</div>
                            <div class="data-value">{behandelplan_data.get('letselsoort') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Letselspecificatie</div>
                            <div class="data-value">{behandelplan_data.get('letselspecificatie') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Letsel zijde</div>
                            <div class="data-value">{behandelplan_data.get('letsel_zijde') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Dominante zijde beïnvloedt</div>
                            <div class="data-value">{yes_no(behandelplan_data.get('dominante_zijde_beinvloedt'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Klachten</div>
                            <div class="data-value">{behandelplan_data.get('klachten') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Diagnose</div>
                            <div class="data-value">{behandelplan_data.get('diagnose') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Beperkingen</div>
                            <div class="data-value">{behandelplan_data.get('beperkingen') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Pre-existente bijzonderheden</div>
                            <div class="data-value">{yes_no(behandelplan_data.get('bijzonderheden_pre_existente'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Hersteld</div>
                            <div class="data-value">{yes_no(behandelplan_data.get('hersteld'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Datum eindsituatie</div>
                            <div class="data-value">{format_date(behandelplan_data.get('datum_eindsituatie'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Medisch advies</div>
                            <div class="data-value">{behandelplan_data.get('medisch_advies') or '-'}</div>
                        </div>
                    </div>
                </div>
"""
    
    # Section 3: Arbeid
    html_content += """
                <div class="section">
                    <div class="section-header">
                        <div class="section-number">3</div>
                        <div class="section-title">Arbeidsongeschiktheid & Werk</div>
                    </div>
"""
    
    if summaries.get('ai_summary_arbeid'):
        html_content += f"""
                    <div class="summary-box">
                        <h3>AI Samenvatting</h3>
                        <p>{summaries['ai_summary_arbeid']}</p>
                    </div>
"""
    
    html_content += f"""
                    <div class="data-grid">
                        <div class="data-row">
                            <div class="data-label">Beroep</div>
                            <div class="data-value">{behandelplan_data.get('beroep') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Dienstverband</div>
                            <div class="data-value">{behandelplan_data.get('dienstverband') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Omvang dienstverband</div>
                            <div class="data-value">{behandelplan_data.get('omvang_dienstverband') or '-'} uur/week</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Netto inkomen</div>
                            <div class="data-value">{format_currency(behandelplan_data.get('netto_inkomen'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Nu arbeidsongeschikt</div>
                            <div class="data-value">{yes_no(behandelplan_data.get('nu_arbeidsongeschikt'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Arbeidsongeschiktheid %</div>
                            <div class="data-value">{format_percentage(behandelplan_data.get('percentage_arbeidsongeschikt'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Startdatum arbeidsongeschiktheid</div>
                            <div class="data-value">{format_date(behandelplan_data.get('arbeidsongeschiktheid_startdatum'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Einddatum arbeidsongeschiktheid</div>
                            <div class="data-value">{format_date(behandelplan_data.get('arbeidsongeschiktheid_einddatum'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Interventies</div>
                            <div class="data-value">{behandelplan_data.get('interventies') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Prognose</div>
                            <div class="data-value">{behandelplan_data.get('prognose') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Overwegingen</div>
                            <div class="data-value">{behandelplan_data.get('arbeid_overweging') or '-'}</div>
                        </div>
                    </div>
                </div>
"""
    
    # Section 4: Sociaal
    html_content += """
                <div class="section">
                    <div class="section-header">
                        <div class="section-number">4</div>
                        <div class="section-title">Privésituatie & Sociale Omstandigheden</div>
                    </div>
"""
    
    if summaries.get('ai_summary_sociaal'):
        html_content += f"""
                    <div class="summary-box">
                        <h3>AI Samenvatting</h3>
                        <p>{summaries['ai_summary_sociaal']}</p>
                    </div>
"""
    
    html_content += f"""
                    <div class="data-grid">
                        <div class="data-row">
                            <div class="data-label">Samenstelling huishouden</div>
                            <div class="data-value">{behandelplan_data.get('samenstelling_huishouden') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Aandeel huishoudelijke taken</div>
                            <div class="data-value">{format_percentage(behandelplan_data.get('aandeel_huishoudelijke_taken'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Aandeel zelfwerkzaamheid</div>
                            <div class="data-value">{format_percentage(behandelplan_data.get('aandeel_zelfwerkzaamheid'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Nu beperkt</div>
                            <div class="data-value">{yes_no(behandelplan_data.get('nu_beperkt'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Startdatum beperkingen</div>
                            <div class="data-value">{format_date(behandelplan_data.get('sociaal_startdatum'))}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Overwegingen</div>
                            <div class="data-value">{behandelplan_data.get('sociaal_overweging') or '-'}</div>
                        </div>
                    </div>
                </div>
"""
    
    # Section 5: Strategie
    html_content += """
                <div class="section">
                    <div class="section-header">
                        <div class="section-number">5</div>
                        <div class="section-title">Strategie & Scenario's</div>
                    </div>
"""
    
    if summaries.get('ai_summary_strategie'):
        html_content += f"""
                    <div class="summary-box">
                        <h3>AI Samenvatting</h3>
                        <p>{summaries['ai_summary_strategie']}</p>
                    </div>
"""
    
    html_content += f"""
                    <div class="data-grid">
                        <div class="data-row">
                            <div class="data-label">Reden lopend dossier</div>
                            <div class="data-value">{behandelplan_data.get('reden_lopend_dossier') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Oplossingsrichting</div>
                            <div class="data-value">{behandelplan_data.get('oplossingsrichting') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Scenario's</div>
                            <div class="data-value">{behandelplan_data.get('scenarios') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Vervolgstappen</div>
                            <div class="data-value">{behandelplan_data.get('vervolgstappen') or '-'}</div>
                        </div>
                        <div class="data-row">
                            <div class="data-label">Motivering</div>
                            <div class="data-value">{behandelplan_data.get('motivering') or '-'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
"""
    
    return html_content
