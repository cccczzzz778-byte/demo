(function(){
  const DMED=window.DMED=window.DMED||{};
  function downloadStaffExcel(){
    let url='/api/export/staff.xlsx';
    if(DMED.state.me?.role==='admin'&&DMED.state.selectedInstitutionId){
      url+=`?institutionId=${encodeURIComponent(DMED.state.selectedInstitutionId)}`;
    }
    window.location.assign(url);
  }
  function init(){
    document.getElementById('exportStaffBtn')?.addEventListener('click',downloadStaffExcel);
    document.getElementById('reportExportBtn')?.addEventListener('click',downloadStaffExcel);
  }
  DMED.reports={init,downloadStaffExcel};
})();
