// frontend/js/marks.js

async function loadMarks() {
  try {
    const [marks, students, subjects] = await Promise.all([
      MarksAPI.all(),
      StudentsAPI.all(),
      SubjectsAPI.all(),
    ]);

    // Populate modal dropdowns
    const stuSel = document.getElementById('m-student');
    stuSel.innerHTML = students.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
    const subSel = document.getElementById('m-subject');
    subSel.innerHTML = subjects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');

    // Render table
    const tbody = document.querySelector('#tbl-marks tbody');
    tbody.innerHTML = '';
    marks.slice(0, 100).forEach(m => {
      tbody.innerHTML += `
        <tr>
          <td><b>${m.student_name}</b></td>
          <td class="text-muted">${m.subject_name}</td>
          <td>${m.test1}/50</td>
          <td>${m.test2}/50</td>
          <td>${m.assignment}/25</td>
          <td>${m.final_exam}/100</td>
          <td><b>${m.total}</b>/100 ${progressBar(m.total)}</td>
          <td><span class="badge ${gradeBadge(m.total)}">${m.grade}</span></td>
        </tr>`;
    });
  } catch (err) {
    showToast('Failed to load marks: ' + err.message, 'error');
  }
}

async function submitMarks() {
  const student_id  = document.getElementById('m-student').value;
  const subject_id  = document.getElementById('m-subject').value;
  const test1       = document.getElementById('m-test1').value;
  const test2       = document.getElementById('m-test2').value;
  const assignment  = document.getElementById('m-assign').value;
  const final_exam  = document.getElementById('m-final').value;

  if (!test1 || !test2 || !assignment || !final_exam) {
    showToast('Please fill all mark fields', 'error'); return;
  }
  try {
    const res = await MarksAPI.save({ student_id, subject_id, test1, test2, assignment, final_exam });
    showToast(`Marks saved! Total: ${res.total} (${res.grade})`, 'success');
    closeModal('modal-marks');
    loadMarks();
  } catch (err) {
    showToast('Failed to save marks: ' + err.message, 'error');
  }
}
