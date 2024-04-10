// Dom Loaded and Event Listeners
document.addEventListener('DOMContentLoaded', function() {

  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', post_email);
  document.querySelector('#email-view').addEventListener('click', function(event) { 
    const element = event.target;
    // archive button pressed
    if (element.id === 'archive') {
      const emailId = element.dataset.emailId; 
      console.log(emailId)
      console.log(element.innerText.includes('Archive'));
      element.innerText = element.innerText.includes('Archive') ? 'Unarchive' : 'Archive';
      archive_email(emailId, !element.innerText.includes('Archive'));

    // reply button pressed
    } else if (element.id === 'reply') {
      compose_email();
      document.querySelector('#compose-recipients').value = document.querySelector('#email-sender').innerText;
      if (!document.querySelector('#email-subject').innerText.startsWith('Re:')) {
        document.querySelector('#compose-subject').value = `Re: ${document.querySelector('#email-subject').innerText}`;
      } else {
        document.querySelector('#compose-subject').value = document.querySelector('#email-subject').innerText;
      }
      document.querySelector('#compose-body').value = `\n\n\n\n\n\n\n\n\n ------------------------------------- \n On ${document.querySelector('#email-timestamp').innerText} \n ${document.querySelector('#email-sender').innerText} wrote: \n\n ${document.querySelector('#email-body').innerText}`;

    // back button pressed
    } else if (element.id === 'back') {
      load_mailbox('inbox');
    }
  });
  load_mailbox('inbox');
});

// Functions
function load_mailbox(mailbox) {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      createAllEmailsTable(emails);
    });
}

function createAllEmailsTable(emails) {
  var table = document.createElement('table');
  table.className = 'table';
  var thead = document.createElement('thead');
  thead.innerHTML = `
        <tr>
          <th>Sender</th>
          <th>Subject</th>
          <th>Time</th>
        </tr>
  `;
  table.appendChild(thead);
  var tbody = document.createElement('tbody');
  emails.forEach(email => {
    var emailItem = document.createElement('tr');
    emailItem.innerHTML = `
          <td>${email.sender}</td>
          <td>${email.subject}</td>
          <td>${email.timestamp}</td>
    `;
    if (email.read) {
      emailItem.style.backgroundColor = 'lightgray';
    }
    emailItem.style.cursor = 'pointer';
    emailItem.addEventListener('click', () => view_email(email.id));
    tbody.appendChild(emailItem);
  });
  table.appendChild(tbody);
  document.querySelector('#emails-view').appendChild(table);
}

function view_email(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';
  read_email(email_id, true);
  /* load the view */ 
  fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
      const username = document.body.dataset.username; 
      const archiveButtonHTML = email.sender === username && !email.recipients.includes(username) ? '' : `<button id="archive" class="btn btn-primary" data-email-id="${email.id}">${email.archived ? 'Unarchive' : 'Archive'}</button>`;
      document.querySelector('#email-view').innerHTML = `
        <table class="table">
          <tr><td>From:</td><td><span id="email-sender">${email.sender}</span></td></tr>
          <tr><td>To:</td><td id="email-recipients">${email.recipients}</td></tr>
          <tr><td>Subject:</td><td id="email-subject">${email.subject}</td></tr>
          <tr><td>Timestamp:</td><td><span id="email-timestamp">${email.timestamp}</span></td></tr>
          <tr><td>Body:</td><td id="email-body">${email.body}</td></tr>
        </table>
        ${archiveButtonHTML}
        <button id="reply" class="btn btn-primary">Reply</button>
        <button id="back" class="btn btn-primary">Back</button>
      `;
    });
}

function compose_email() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function post_email() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();;
  })
  .then(data => {
    console.log(data.message);
    load_mailbox('sent');
  })
  .catch(error => {
    console.log('There was a problem with the fetch operation: ' + error.message);
  });
}

function archive_email(email_id, archive) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archive
    })
  })
  .then(() => load_mailbox("inbox"))
  .catch(error => {
    console.log('There was a problem with the fetch operation: ' + error.message);
  });
}

function read_email(email_id, read) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: read
    })
  });
}