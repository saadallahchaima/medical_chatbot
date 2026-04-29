import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { X, FileText, Download, Loader2 } from 'lucide-react';

// ── Professional Medical Color Palette ──
const COLORS = {
  primary: '#1e40af',
  secondary: '#0f766e',
  accent: '#dc2626',
  dark: '#1e293b',
  gray: '#64748b',
  lightGray: '#f8fafc',
  border: '#e2e8f0',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 60,
    paddingHorizontal: 30,
    backgroundColor: COLORS.white,
    fontFamily: 'Helvetica',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  institutionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  institutionSub: {
    fontSize: 8,
    color: COLORS.gray,
    marginBottom: 2,
  },
  documentType: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.secondary,
    textTryoform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: COLORS.lightGray,
    alignSelf: 'flex-start',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docRef: {
    fontSize: 8,
    color: COLORS.gray,
    marginBottom: 2,
  },
  docDate: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.dark,
  },

  // ── Patient Info ──
  patientBox: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  patientBoxTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTryoform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  patientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  patientField: {
    flexDirection: 'row',
    gap: 3,
  },
  patientLabel: {
    fontSize: 8,
    color: COLORS.gray,
    fontWeight: 'bold',
  },
  patientValue: {
    fontSize: 9,
    color: COLORS.dark,
    fontWeight: 'bold',
  },
  patientValueRed: {
    fontSize: 9,
    color: COLORS.accent,
    fontWeight: 'bold',
  },

  // ── Section ──
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTryoform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  text: {
    fontSize: 9,
    color: COLORS.dark,
    lineHeight: 1.5,
    textAlign: 'left',
  },

  // ── Boxes ──
  box: {
    borderRadius: 3,
    padding: 10,
    marginVertical: 6,
  },
  boxBlue: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  boxRed: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  boxGreen: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  boxTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  boxTitleBlue: { color: COLORS.primary },
  boxTitleRed: { color: COLORS.accent },
  boxTitleGreen: { color: COLORS.secondary },

  // ── Lists ──
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 9,
    color: COLORS.primary,
    marginRight: 5,
    marginTop: 1,
    width: 10,
  },
  listText: {
    fontSize: 9,
    color: COLORS.dark,
    lineHeight: 1.4,
    flex: 1,
  },

  // ── Images ──
  imageSection: {
    marginTop: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  imageContainer: {
    width: '48%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 3,
    backgroundColor: COLORS.lightGray,
  },
  medicalImage: {
    width: '100%',
    height: 120,
    objectFit: 'contain',
  },
  imageCaption: {
    fontSize: 7,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 3,
  },

  // ── Divider & Meta ──
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 8,
    color: COLORS.gray,
  },
  metaValue: {
    fontSize: 8,
    color: COLORS.dark,
    fontWeight: 'bold',
  },

  // ── Signature ──
  signatureSection: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  signatureBox: {
    alignItems: 'center',
    width: 180,
  },
  signatureLine: {
    width: 160,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark,
    marginBottom: 4,
    paddingTop: 24,
  },
  signatureLabel: {
    fontSize: 8,
    color: COLORS.gray,
    textAlign: 'center',
  },
  stampBox: {
    width: 80,
    height: 80,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 40,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontSize: 7,
    color: COLORS.primary,
    textAlign: 'center',
  },

  // ── Footer (not absolute) ──
  footer: {
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 1.3,
  },
});

function formatDate(dateStr) {
  if (!dateStr) return '--/--/----';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function generateRef() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `MA-${y}${m}${d}-${r}`;
}

// ── Single Consultation Page ──
function ConsultationPage({ consultation, index, total }) {
  return (
    <Page size="A4" style={styles.page}>
      {/* Only show header on first page of a multi-page doc */}
      {index === 0 && (
        <>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.institutionName}>MediAgent — Centre Médical</Text>
              <Text style={styles.institutionSub}>
                Plateforme d'Assistance Clinique IA · Support décisionnel
              </Text>
              <Text style={styles.documentType}>Rapport Clinique</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.docRef}>Réf: {generateRef()}</Text>
              <Text style={styles.docDate}>{formatDate(new Date().toISOString())}</Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Consultation #{total - index}</Text>
        <Text style={styles.metaValue}>{formatDate(consultation.date)}</Text>
      </View>

      {/* Chief Complaint */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Motif de Consultation</Text>
        <Text style={styles.text}>{consultation.query || 'Non spécifié'}</Text>
      </View>

      {/* Clinical Context */}
      {consultation.context && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contexte Clinique</Text>
          <Text style={styles.text}>{consultation.context}</Text>
        </View>
      )}

      {/* Alerts */}
      {consultation.alerts && consultation.alerts.length > 0 && (
        <View style={[styles.box, styles.boxRed]}>
          <Text style={[styles.boxTitle, styles.boxTitleRed]}>
            ⚠ Alertes Cliniques
          </Text>
          {consultation.alerts.map((alert, i) => (
            <Text key={i} style={styles.text}>• {alert}</Text>
          ))}
        </View>
      )}

      {/* Primary Diagnosis */}
      <View style={[styles.box, styles.boxBlue]}>
        <Text style={[styles.boxTitle, styles.boxTitleBlue]}>
          Diagnosis Principal
        </Text>
        <Text style={styles.text}>
          {consultation.diagnosis || 'En attente de confirmation'}
        </Text>
      </View>

      {/* Treatment */}
      {consultation.treatment && (
        <View style={[styles.box, styles.boxGreen]}>
          <Text style={[styles.boxTitle, styles.boxTitleGreen]}>
            Plan de Treatment
          </Text>
          <Text style={styles.text}>{consultation.treatment}</Text>
        </View>
      )}

      {/* Recommendations */}
      {consultation.recommendations && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommandations</Text>
          <Text style={styles.text}>{consultation.recommendations}</Text>
        </View>
      )}

      {/* Score */}
      {consultation.score && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scores Cliniques</Text>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>▸</Text>
            <Text style={styles.listText}>{consultation.score}</Text>
          </View>
        </View>
      )}

      {/* Images */}
      {consultation.files && consultation.files.length > 0 && (
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Imagerie Médicale Jointe</Text>
          <View style={styles.imageGrid}>
            {consultation.files.map((img, idx) => (
              <View key={idx} style={styles.imageContainer}>
                <Image src={img.url} style={styles.medicalImage} />
                <Text style={styles.imageCaption}>
                  Image {idx + 1}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Signature on last page */}
      {index === total - 1 && (
        <>
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Signature du Médecin</Text>
              <Text style={styles.signatureLabel}>Last Name, Titre, N° Ordre</Text>
            </View>
            <View style={styles.stampBox}>
              <Text style={styles.stampText}>CACHET</Text>
              <Text style={styles.stampText}>MÉDICAL</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Ce rapport a été généré par MediAgent, un système d'assistance clinique basé sur l'IA.{"\n"}
              Les informations sont à titre indicatif et ne constituent pas un avis médical définitif.{"\n"}
              Validation par un professionnel de santé qualifié indispensable.{"\n"}
              Document confidentiel — Réservé à l'usage médical.
            </Text>
          </View>
        </>
      )}
    </Page>
  );
}

// ── Cover Page with Patient Info ──
function CoverPage({ data }) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.institutionName}>MediAgent — Centre Médical</Text>
          <Text style={styles.institutionSub}>
            Plateforme d'Assistance Clinique IA · Support décisionnel
          </Text>
          <Text style={styles.documentType}>Rapport Clinique</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.docRef}>Réf: {generateRef()}</Text>
          <Text style={styles.docDate}>{formatDate(new Date().toISOString())}</Text>
        </View>
      </View>

      <View style={styles.patientBox}>
        <Text style={styles.patientBoxTitle}>Identification du Patient</Text>
        <View style={styles.patientGrid}>
          <View style={styles.patientField}>
            <Text style={styles.patientLabel}>NOM:</Text>
            <Text style={styles.patientValue}>{data.name || 'Not specified'}</Text>
          </View>
          <View style={styles.patientField}>
            <Text style={styles.patientLabel}>ÂGE:</Text>
            <Text style={styles.patientValue}>{data.age ? `${data.age} yo` : '--'}</Text>
          </View>
          <View style={styles.patientField}>
            <Text style={styles.patientLabel}>SEXE:</Text>
            <Text style={styles.patientValue}>{data.sex || '--'}</Text>
          </View>
          {data.weight && (
            <View style={styles.patientField}>
              <Text style={styles.patientLabel}>POIDS:</Text>
              <Text style={styles.patientValue}>{data.weight} kg</Text>
            </View>
          )}
        </View>
        {(data.allergies?.length > 0 || data.medications?.length > 0) && (
          <View style={[styles.patientGrid, { marginTop: 6 }]}>
            {data.allergies?.length > 0 && (
              <View style={styles.patientField}>
                <Text style={styles.patientLabel}>ALLERGIES:</Text>
                <Text style={styles.patientValueRed}>{data.allergies.join(', ')}</Text>
              </View>
            )}
            {data.medications?.length > 0 && (
              <View style={styles.patientField}>
                <Text style={styles.patientLabel}>TRAITEMENT:</Text>
                <Text style={styles.patientValue}>{data.medications.join(', ')}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Record Summary</Text>
        <View style={styles.listItem}>
          <Text style={styles.bullet}>▸</Text>
          <Text style={styles.listText}>
            Last Namebre de consultations: {data.consultations?.length || 0}
          </Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.bullet}>▸</Text>
          <Text style={styles.listText}>
            Première consultation: {formatDate(data.consultations?.[data.consultations.length - 1]?.date)}
          </Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.bullet}>▸</Text>
          <Text style={styles.listText}>
            Dernière consultation: {formatDate(data.consultations?.[0]?.date)}
          </Text>
        </View>
      </View>
    </Page>
  );
}

// ── Main Document ──
const ClinicalDocument = ({ data }) => {
  const consultations = data.consultations || [];

  return (
    <Document>
      <CoverPage data={data} />
      {consultations.map((c, i) => (
        <ConsultationPage
          key={c.id || i}
          consultation={c}
          index={i}
          total={consultations.length}
        />
      ))}
    </Document>
  );
};

export default function PDFExportModal({ onClose, patientData }) {
  const fileName = `Rapport_Medical_${patientData?.name?.replace(/\s+/g, '_') || 'Patient'}_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h3 className="text-white font-bold flex items-center gap-2">
            <FileText size={18} /> Aperçu du Rapport Médical
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white tryoition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 bg-slate-800">
          <PDFViewer width="100%" height="100%" className="border-none">
            <ClinicalDocument data={patientData} />
          </PDFViewer>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Ce document est un support décisionnel et nécessite la validation d'un médecin.
          </p>
          <PDFDownloadLink
            document={<ClinicalDocument data={patientData} />}
            fileName={fileName}
          >
            {({ loading }) => (
              <button
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-sm tryoition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Préparation...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Télécharger PDF
                  </>
                )}
              </button>
            )}
          </PDFDownloadLink>
        </div>
      </div>
    </div>
  );
}

