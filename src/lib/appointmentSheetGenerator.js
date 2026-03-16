/**
 * Appointment Sheet Generator
 * Creates PDF appointment sheets for patients and doctors
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function generateAppointmentSheetPDF(appointmentData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const { patient, doctor, appointment } = appointmentData;

      // Helper function to add text
      const addText = (text, x, y, options = {}) => {
        doc.fontSize(options.fontSize || 12).font(options.font || 'Helvetica');
        if (options.bold) doc.font('Helvetica-Bold');
        if (options.italic) doc.font('Helvetica-Oblique');
        doc.text(text, x, y, options);
      };

      // Header with Logo
      try {
        // Try to load logo from public directory
        const logoPath = path.join(process.cwd(), 'public', 'last-logo.png');
        if (fs.existsSync(logoPath)) {
          // Add logo on the left
          doc.image(logoPath, 50, 40, { width: 50, height: 50 });
          // Add title next to logo
          doc.fillColor('#1e40af').fontSize(20).font('Helvetica-Bold').text('APPOINTMENT SHEET', 110, 50);
          doc.fillColor('#64748b').fontSize(12).font('Helvetica').text('Dr. Sanaullah Welfare Foundation', 110, 75);
        } else {
          // Fallback without logo
          doc.fillColor('#1e40af').fontSize(24).font('Helvetica-Bold').text('APPOINTMENT SHEET', 50, 50, { align: 'center' });
          doc.fillColor('#64748b').fontSize(14).font('Helvetica').text('Dr. Sanaullah Welfare Foundation', 50, 80, { align: 'center' });
        }
      } catch (error) {
        // Fallback without logo if image loading fails
        doc.fillColor('#1e40af').fontSize(24).font('Helvetica-Bold').text('APPOINTMENT SHEET', 50, 50, { align: 'center' });
        doc.fillColor('#64748b').fontSize(14).font('Helvetica').text('Dr. Sanaullah Welfare Foundation', 50, 80, { align: 'center' });
      }
      
      // Date generated
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`, 50, 100, { align: 'center' });

      // Divider
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 115).lineTo(545, 115).stroke();

      // Patient Information Section
      doc.fillColor('#1e40af').fontSize(16).font('Helvetica-Bold').text('PATIENT INFORMATION', 50, 140);
      doc.fillColor('#374151').fontSize(12).font('Helvetica');
      
      let yPosition = 165;
      addText(`Name: ${patient?.name || 'N/A'}`, 50, yPosition);
      yPosition += 20;
      addText(`Age: ${patient?.age || 'N/A'}`, 50, yPosition);
      yPosition += 20;
      addText(`Gender: ${patient?.gender || 'N/A'}`, 50, yPosition);
      yPosition += 20;
      addText(`Phone: ${patient?.phone || 'N/A'}`, 50, yPosition);
      yPosition += 20;
      addText(`Email: ${patient?.email || 'N/A'}`, 50, yPosition);

      // Doctor Information Section
      yPosition += 30;
      doc.fillColor('#1e40af').fontSize(16).font('Helvetica-Bold').text('DOCTOR INFORMATION', 300, yPosition);
      yPosition += 25;
      doc.fillColor('#374151').fontSize(12).font('Helvetica');
      
      addText(`Dr. ${doctor?.name || 'N/A'}`, 300, yPosition);
      yPosition += 20;
      addText(`Specialization: ${doctor?.specialization || 'N/A'}`, 300, yPosition);
      yPosition += 20;
      addText(`Degrees: ${doctor?.degrees || 'N/A'}`, 300, yPosition);

      // Appointment Details Section
      yPosition = Math.max(yPosition + 30, 265);
      doc.fillColor('#1e40af').fontSize(16).font('Helvetica-Bold').text('APPOINTMENT DETAILS', 50, yPosition);
      yPosition += 25;
      doc.fillColor('#374151').fontSize(12).font('Helvetica');
      
      addText(`Date: ${appointment?.date || 'N/A'}`, 50, yPosition);
      yPosition += 20;
      addText(`Time: ${appointment?.time || 'N/A'}`, 50, yPosition);
      yPosition += 20;
      addText(`Type: ${appointment?.type || 'In-Clinic'}`, 50, yPosition);
      yPosition += 20;
      addText(`Status: ${appointment?.status || 'Pending'}`, 50, yPosition);
      yPosition += 20;
      addText(`Consultation Fee: ${appointment?.consultationFee || 'N/A'}`, 50, yPosition);

      // Reason for Visit Section
      if (appointment?.reason) {
        yPosition += 30;
        doc.fillColor('#1e40af').fontSize(16).font('Helvetica-Bold').text('REASON FOR VISIT', 50, yPosition);
        yPosition += 25;
        doc.fillColor('#374151').fontSize(12).font('Helvetica');
        addText(appointment.reason, 50, yPosition, { width: 495 });
      }

      // Medical Notes Section (Empty for doctor to fill)
      yPosition = Math.max(yPosition + 60, 400);
      doc.fillColor('#1e40af').fontSize(16).font('Helvetica-Bold').text('MEDICAL NOTES', 50, yPosition);
      yPosition += 25;
      
      // Draw a large box for medical notes
      doc.strokeColor('#d1d5db').lineWidth(1).rect(50, yPosition, 495, 150).stroke();
      
      // Add placeholder text inside the box
      doc.fillColor('#9ca3af').fontSize(11).font('Helvetica-Oblique');
      doc.text('(Doctor to fill in medical notes, diagnosis, and treatment plan)', 55, yPosition + 5);

      // Prescription Section (Empty for doctor to fill)
      yPosition += 170;
      doc.fillColor('#1e40af').fontSize(16).font('Helvetica-Bold').text('PRESCRIPTION', 50, yPosition);
      yPosition += 25;
      
      // Draw a box for prescription
      doc.strokeColor('#d1d5db').lineWidth(1).rect(50, yPosition, 495, 100).stroke();
      
      // Add placeholder text inside the prescription box
      doc.fillColor('#9ca3af').fontSize(11).font('Helvetica-Oblique');
      doc.text('(Doctor to prescribe medications here)', 55, yPosition + 5);

      // Follow-up Section
      yPosition += 120;
      doc.fillColor('#1e40af').fontSize(14).font('Helvetica-Bold').text('FOLLOW-UP', 50, yPosition);
      yPosition += 20;
      doc.fillColor('#374151').fontSize(12).font('Helvetica');
      addText('Follow-up Date: _________________', 50, yPosition);
      yPosition += 20;
      addText('Next Appointment: _________________', 50, yPosition);

      // Footer
      yPosition = 750;
      doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, yPosition).lineTo(545, yPosition).stroke();
      
      // Signature lines
      yPosition += 20;
      doc.fillColor('#374151').fontSize(10).font('Helvetica');
      addText('Doctor Signature: _________________________', 50, yPosition);
      addText('Date: _________________', 350, yPosition);
      
      yPosition += 30;
      addText('Patient Signature: _________________________', 50, yPosition);
      addText('Date: _________________', 350, yPosition);

      // Footer text
      doc.fillColor('#64748b').fontSize(8).font('Helvetica');
      doc.text('This appointment sheet is generated by Dr. Sanaullah Welfare Foundation Management System', 50, 780, { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

export function generateAppointmentSheetFileName(appointment) {
  const patientName = appointment.patient?.name || 'Patient';
  const doctorName = appointment.doctor?.name || 'Doctor';
  const date = appointment.appointment?.date || new Date().toISOString().split('T')[0];
  
  // Clean names for filename
  const cleanPatientName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanDoctorName = doctorName.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `Appointment_Sheet_${cleanPatientName}_Dr_${cleanDoctorName}_${date}.pdf`;
}
