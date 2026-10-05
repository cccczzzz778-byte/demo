(function(){
  const DMED=window.DMED=window.DMED||{};
  function downloadStaffExcel(){
    const params=new URLSearchParams({lang:DMED.state.lang||'uz'});
    if(DMED.state.me?.role==='admin'&&DMED.state.selectedInstitutionId)params.set('institutionId',DMED.state.selectedInstitutionId);
    window.location.assign(`/api/export/staff.xlsx?${params.toString()}`);
  }
  function init(){document.getElementById('exportStaffBtn')?.addEventListener('click',downloadStaffExcel);document.getElementById('reportExportBtn')?.addEventListener('click',downloadStaffExcel);}
  DMED.reports={init,downloadStaffExcel};
})();
