import React from 'react';

export default function ResourceTable({columns,rows,loading,error,empty='No records found.'}){
  if(loading)return <div className="table-state" role="status" aria-live="polite">Loading…</div>;
  if(error)return <div className="table-state error-state" role="alert">{error}</div>;
  if(!rows.length)return <div className="table-state" role="status">{empty}</div>;
  return <div className="data-table-wrap"><table className="data-table"><thead><tr>{columns.map(c=><th key={c.key} scope="col">{c.label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={row.id??index}>{columns.map(c=><td key={c.key}>{c.render?c.render(row):row[c.key]??'—'}</td>)}</tr>)}</tbody></table></div>;
}
