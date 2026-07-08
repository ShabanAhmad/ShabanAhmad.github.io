import re

with open("index.html", "r") as f:
    content = f.read()

start_idx = content.find("<div class=\"patents-awards-subsection\"")
end_idx = content.find("<!-- === SECTION 11: SCIENTIFIC PUBLICATION FRAMEWORK === -->")

if start_idx != -1 and end_idx != -1:
    new_html = """        <div class="patents-awards-subsection" style="margin-top: 1.5rem; width: 100%;">
            <div class="unified-sub-heading ush-primary" style="margin-bottom: 12px;"><i class="fas fa-trophy" style="color: var(--accent); margin-right: 8px;" aria-hidden="true"></i> Patents &amp; Awards</div>
            
            <div class="awards-metric-grid" style="grid-template-columns: repeat(2, 1fr);">
                <button class="metric-tab-btn" id="tab-btn-patents" onclick="switchAwardsTab('patents')">
                    <i class="fas fa-certificate mt-icon"></i>
                    <div class="mt-content">
                        <div class="mt-title">Patents (IPR)</div>
                        <div class="mt-stats-flex">
                            <div class="mt-stat-group">
                                <span class="mt-num">1</span>
                                <span class="mt-sub-label">Granted</span>
                            </div>
                            <div class="mt-stat-divider"></div>
                            <div class="mt-stat-group">
                                <span class="mt-num">06</span>
                                <span class="mt-sub-label">Pipeline</span>
                            </div>
                        </div>
                    </div>
                </button>
                
                <button class="metric-tab-btn" id="tab-btn-awards" onclick="switchAwardsTab('awards')">
                    <i class="fas fa-medal mt-icon"></i>
                    <div class="mt-content">
                        <div class="mt-title">Awards &amp; Honors</div>
                        <div class="mt-stats-flex">
                            <div class="mt-stat-group">
                                <span class="mt-num">14</span>
                                <span class="mt-sub-label">Total Recognitions</span>
                            </div>
                        </div>
                    </div>
                </button>
            </div>

            <!-- PANEL 1: PATENTS -->
            <div class="awards-panel active" id="panel-patents" style="display: block;">
                <div class="patent-dashboard">
                    <!-- Granted German Patent Card -->
                    <div class="patent-card patent-card-granted">
                        <div class="patent-badge-row">
                            <span class="patent-status-badge status-granted">
                                <i class="fas fa-check-circle" aria-hidden="true"></i> Granted
                            </span>
                            <span class="patent-territory">
                                <span class="flag-wrapper" data-tip="Germany">
                                    <img src="https://flagcdn.com/w20/de.png" class="flag-img" loading="lazy" alt="DE">
                                </span>
                            </span>
                        </div>
                        <div class="patent-title">Extended-Release Tablet Composition for Multitarget Cancer Therapy</div>
                        <div class="patent-desc">An innovative extended-release formulation designed for multi-target oncology therapeutics.</div>
                        <div class="patent-footer">
                            <span class="patent-id">DE 20 2024 101 028.0</span>
                            <a href="https://register.dpma.de/DPMAregister/pat/register?AKZ=2020241010280&amp;CURSOR=8" target="_blank" rel="noopener noreferrer" class="patent-link">
                                DPMA Registry <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Pipeline Patents Card -->
                    <div class="patent-card patent-card-pipeline">
                        <div class="patent-badge-row">
                            <span class="patent-status-badge status-pipeline">
                                <i class="fas fa-file-signature" aria-hidden="true"></i> In Pipeline
                            </span>
                            <span class="patent-territory" style="display: flex; gap: 6px; align-items: center;">
                                <span class="flag-wrapper" data-tip="United States">
                                    <img src="https://flagcdn.com/w20/us.png" class="flag-img" loading="lazy" alt="US">
                                </span>
                                <span style="color: #ef4444; font-weight: 700; font-size: 0.8rem;">|</span>
                                <span class="flag-wrapper" data-tip="India">
                                    <img src="https://flagcdn.com/w20/in.png" class="flag-img" loading="lazy" alt="IN">
                                </span>
                            </span>
                        </div>
                        <div class="patent-title"><span class="patent-highlight-num">06</span> Drug Molecules in Development</div>
                        <div class="patent-desc">Patent applications filed for novel drug molecules designed during doctoral research.</div>
                        <div class="patent-footer">
                            <span class="patent-id">Status: Examination Stage</span>
                            <span class="patent-applications-count">01 US <span style="color: #ef4444; font-weight: 700;">|</span> 05 Indian</span>
                        </div>
                    </div>
                </div>
            </div>

            <hr class="subtle-separator" id="patents-awards-divider">

            <!-- PANEL 2: AWARDS -->
            <div class="awards-panel active" id="panel-awards" style="display: block;">
                <!-- Flagship Hero: World's Top 2% Scientists -->
                <a href="https://topscinet.com/scientist_profile/Ahmad,%20Shaban/2020/?stype=single_year" target="_blank" rel="noopener noreferrer" class="award-hero-spotlight" style="margin-bottom: 25px; display: block;">
                    <div class="award-hero-glow"></div>
                    <div class="award-hero-left">
                        <div class="award-hero-icon">
                            <i class="fas fa-medal" aria-hidden="true"></i>
                        </div>
                        <div class="award-hero-copy">
                            <div class="award-hero-label">Stanford University &amp; Elsevier · 2025</div>
                            <div class="award-hero-title">World's Top 2% Scientists</div>
                            <div class="award-hero-desc">Recognised globally for citation impact in AI-driven drug discovery and computational genomics — a distinction awarded to fewer than 2% of researchers worldwide.</div>
                        </div>
                    </div>
                    <div class="award-hero-right">
                        <span class="award-hero-pct">Top<br><strong>2%</strong></span>
                        <span class="award-hero-badge">Global Recognition</span>
                    </div>
                </a>

                <div class="award-box-grid custom-awards-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); padding: 15px 0;">
                    <!-- Felicitated by VC -->
                    <a href="https://jmi.ac.in/BULLETIN-BOARD/Press-Release/Latest/5668" target="_blank" rel="noopener noreferrer" class="award-card award-tier-gold">
                        <div class="award-icon-box">
                            <i class="fas fa-trophy award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">Felicitated by Vice Chancellor</div>
                            <div class="award-bottom">Felicitated by the Vice Chancellor, Jamia Millia Islamia for academic excellence.</div>
                        </div>
                        <span class="award-year-tag">2025</span>
                    </a>

                    <!-- Achievers of the Year -->
                    <div class="award-card award-tier-gold">
                        <div class="award-icon-box">
                            <i class="fas fa-trophy award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">Achievers of the Year</div>
                            <div class="award-bottom">Awarded by University Registrar and Provost, Jamia Millia Islamia.</div>
                        </div>
                        <span class="award-year-tag">2025</span>
                    </div>

                    <!-- Best Presentation Cancers -->
                    <div class="award-card">
                        <div class="award-icon-box">
                            <i class="fas fa-microphone-alt award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">Best Presentation Award</div>
                            <div class="award-bottom">3rd International Electronic Conference on Cancers (MDPI).</div>
                        </div>
                        <span class="award-year-tag">2023</span>
                    </div>

                    <!-- Best Presentation KAUST -->
                    <div class="award-card">
                        <div class="award-icon-box">
                            <i class="fas fa-award award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">Best Presentation Award</div>
                            <div class="award-bottom">21st International Conference on Bioinformatics (InCoB), KAUST.</div>
                        </div>
                        <span class="award-year-tag">2022</span>
                    </div>
                    
                    <!-- DBT-Studentship ICAR -->
                    <div class="award-card">
                        <div class="award-icon-box">
                            <i class="fas fa-user-graduate award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">DBT-Studentship Fellowship</div>
                            <div class="award-bottom">Awarded 6-month fellowship at ICAR-IARI.</div>
                        </div>
                        <span class="award-year-tag">2020</span>
                    </div>

                    <!-- Best Oral JMI -->
                    <div class="award-card">
                        <div class="award-icon-box">
                            <i class="fas fa-bullhorn award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">Best Oral Presentation</div>
                            <div class="award-bottom">Interdisciplinary Science Conference, JMI, New Delhi.</div>
                        </div>
                        <span class="award-year-tag">2019</span>
                    </div>

                    <!-- Best Poster Presenter CCSMAP -->
                    <div class="award-card">
                        <div class="award-icon-box">
                            <i class="fas fa-image award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">Best Poster Presenter</div>
                            <div class="award-bottom">National Conference on CCSMAP, MRIIRS.</div>
                        </div>
                        <span class="award-year-tag">2019</span>
                    </div>

                    <!-- DBT-Studentship Hamdard -->
                    <div class="award-card">
                        <div class="award-icon-box">
                            <i class="fas fa-certificate award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">DBT-Studentship Fellowship</div>
                            <div class="award-bottom">Awarded 2-month fellowship at Jamia Hamdard.</div>
                        </div>
                        <span class="award-year-tag">2019</span>
                    </div>

                    <!-- 1st Prize Working Model -->
                    <div class="award-card">
                        <div class="award-icon-box">
                            <i class="fas fa-project-diagram award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">1st Prize in Working Model</div>
                            <div class="award-bottom">"PARIVARTAN 2K18", Sri Aurobindo College, DU.</div>
                        </div>
                        <span class="award-year-tag">2018</span>
                    </div>

                    <!-- 26th World Environmental Congress -->
                    <div class="award-card award-tier-gold">
                        <div class="award-icon-box">
                            <i class="fas fa-globe-asia award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">Felicitated at 26th WEC</div>
                            <div class="award-bottom">26th World Environmental Congress, World Environmental and Ecology Development (WEED).</div>
                        </div>
                        <span class="award-year-tag">2017</span>
                    </div>
                    
                    <!-- 2nd Quiz DU -->
                    <div class="award-card">
                        <div class="award-icon-box">
                            <i class="fas fa-star award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">2nd Prize (Quiz/Contest)</div>
                            <div class="award-bottom">Explico Know Your Green in SANJEEVANI, DBC, DU.</div>
                        </div>
                        <span class="award-year-tag">2016</span>
                    </div>
                    
                    <!-- Best Poster Seminar DU -->
                    <div class="award-card">
                        <div class="award-icon-box">
                            <i class="fas fa-file-alt award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">Best Poster Award</div>
                            <div class="award-bottom">ICSSR-sponsored National Seminar, Sri Aurobindo College, DU.</div>
                        </div>
                        <span class="award-year-tag">2016</span>
                    </div>

                    <!-- Innovation Fellowship DU -->
                    <div class="award-card">
                        <div class="award-icon-box">
                            <i class="fas fa-lightbulb award-badge-icon" aria-hidden="true"></i>
                        </div>
                        <div class="award-content-wrapper">
                            <div class="award-top">Innovation Fellowship</div>
                            <div class="award-bottom">DBC311 Innovation Project Fellowship, University of Delhi.</div>
                        </div>
                        <span class="award-year-tag">2015</span>
                    </div>

                </div>
            </div>
        </div>
        <hr class="subtle-separator">
"""
    end_of_block = content.find("<div class=\"selected-publications-container\"", start_idx)
    if end_of_block != -1:
        content = content[:start_idx] + new_html + content[end_of_block:]

with open("index.html", "w") as f:
    f.write(content)
