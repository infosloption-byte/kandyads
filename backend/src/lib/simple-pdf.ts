export function createTextPdf(lines:string[]):Buffer{
  const escape=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  const safeLines=lines.map(line=>String(line).replace(/[^\x20-\x7E]/g,'?')).slice(0,42);
  const commands=['BT','/F1 11 Tf','50 760 Td'];
  safeLines.forEach((line,index)=>{if(index>0)commands.push('0 -17 Td');commands.push(`(${escape(line.slice(0,110))}) Tj`);});
  commands.push('ET');
  const stream=commands.join('\n');
  const objects=[
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream,'ascii')} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf='%PDF-1.4\n';
  const offsets=[0];
  objects.forEach((object,index)=>{offsets.push(Buffer.byteLength(pdf,'ascii'));pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});
  const xrefOffset=Buffer.byteLength(pdf,'ascii');
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<offsets.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf,'ascii');
}
