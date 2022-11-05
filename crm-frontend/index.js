(async () => {
  const URL_API = 'http://localhost:3000/api/clients';

  const
    $clientsList = document.getElementById('clientsList'),
    $btnAddClient = document.getElementById('addClient'),
    $sortBtnAll = document.querySelectorAll('.table__btn'),
    $spinner = createSpinner(),
    $search = document.getElementById('search'),
    $searchForm = document.getElementById('searchForm'),
    $searchResult = document.getElementById('searchResult');

  $clientsList.classList.add('load');
  $clientsList.after($spinner);

  let
    contactNumber = 1,
    sortProperty = 'id',
    sortDir = true,
    timeoutId = null;

  addEventListener('load', () => {
    render();

    if (location.hash) {
      clientChange(location.hash.slice(1));
    };
  });

  function createSpinner(prop = 'load') {
    const xmlns = 'http://www.w3.org/2000/svg',
      svg = document.createElementNS(xmlns, 'svg'),
      circle = document.createElementNS(xmlns, 'circle');

    svg.classList.add('spinner', prop === 'load' ? 'load-spinner' : 'btn-spinner', 'icon');
    svg.setAttributeNS(null, 'viewBox', '0 0 50 50');
    svg.setAttributeNS(null, 'fill', 'none');
    svg.setAttributeNS(null, 'xmls', xmlns);

    circle.classList.add('circle');
    circle.setAttributeNS(null, 'cx', '25');
    circle.setAttributeNS(null, 'cy', '25');
    circle.setAttributeNS(null, 'r', '18');
    circle.setAttributeNS(null, 'fill', 'none');
    circle.setAttributeNS(null, 'stroke-width', prop === 'load' ? '4' : '6');
    circle.setAttributeNS(null, 'stroke', prop !== 'form' ? '#9873FF' : '#B89EFF');

    svg.append(circle);

    return svg;
  };

  // получения списка клиентов
  async function getClients({ id = null, search = null }) {
    let response;
    if (id) {
      response = await fetch(`${URL_API}/${id}`);
    } else if (search) {
      response = await fetch(`${URL_API}?search=${search}`);
    } else {
      response = await fetch(URL_API);
    };

    const data = await response.json();
    return data;
  };

  $btnAddClient.addEventListener('click', () => {
    const $popup = createPopup();
    const { $form, $surnameInp, $nameInp, $errors, $saveClientBtn } = createModalAddOrChangeClient($popup);

    $form.addEventListener('submit', event => {
      event.preventDefault();

      const formData = formValidation($form, $surnameInp, $nameInp, $errors);

      if (formData) {
        $saveClientBtn.classList.add('load');
        $popup.classList.add('load');

        const serverErrors = addClient(formData, $popup, $saveClientBtn);

        if (serverErrors.length) {
          serverErrors.forEach(error => {
            const $error = document.createElement('p');
            $error.classList.add('error');
            $error.textContent = error;
            $errors.append($error);
          });
        };
      };
    });
  });

  // получение данных из полей формы
  function getFormData($form) {
    const
      formData = new FormData($form),
      clientData = {
        surname: formData.get('surname'),
        name: formData.get('name'),
        lastName: formData.get('lastname'),
        contacts: []
      };

    for (let i = 1; i <= 10; i++) {
      let contactType = formData.get(`contactType${i}`);
      let contact = formData.get(`contact${i}`);

      if (!contact) break;

      // приведение номера к нужному формату
      if (contactType === 'Phone') {
        if (contact.startsWith('8') || contact.startsWith('7')) {
          contact = contact.slice(1);
        } else if (contact.startsWith('+7')) {
          contact = contact.slice(2);
        }
        contact = contact.replace(/^(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 ($1) $2-$3-$4');
      };

      clientData.contacts.push({ type: contactType, value: contact });
    };

    return clientData;
  };

  // окно добавления или изменения клиента
  function createModalAddOrChangeClient($popup, client) {
    const
      $title = document.createElement('h2'),
      $id = document.createElement('span'),
      $form = document.createElement('form'),
      $surnameGroup = document.createElement('div'),
      $nameGroup = document.createElement('div'),
      $lastnameGroup = document.createElement('div'),
      $surnameLabel = document.createElement('label'),
      $nameLabel = document.createElement('label'),
      $lastnameLabel = document.createElement('label'),
      $surnameInp = document.createElement('input'),
      $nameInp = document.createElement('input'),
      $lastnameInp = document.createElement('input'),
      $contacts = document.createElement('div'),
      $errors = document.createElement('div'),
      $saveClientBtn = document.createElement('button'),
      $cancelOrDeleteBtn = document.createElement('button'),
      iconLoad = createSpinner('form');

    $title.classList.add('popup__title');
    $id.classList.add('popup__id');
    $form.classList.add('popup__form');
    $surnameGroup.classList.add('popup__input-group');
    $nameGroup.classList.add('popup__input-group');
    $lastnameGroup.classList.add('popup__input-group');
    $surnameLabel.classList.add('popup__label', 'req');
    $nameLabel.classList.add('popup__label', 'req');
    $lastnameLabel.classList.add('popup__label');
    $surnameInp.classList.add('popup__inp');
    $nameInp.classList.add('popup__inp');
    $lastnameInp.classList.add('popup__inp');
    $contacts.classList.add('popup__contacts', 'empty');
    $errors.classList.add('popup__errors', 'empty');
    $saveClientBtn.classList.add('popup__save', 'firm-btn');
    $cancelOrDeleteBtn.classList.add('popup__cancel-delete');

    createContactsList($contacts, client ? client.contacts : null);

    $title.textContent = !client ? 'Новый клиент' : 'Изменить данные';
    $surnameLabel.textContent = 'Фамилия';
    $nameLabel.textContent = 'Имя';
    $lastnameLabel.textContent = 'Отчество';
    $saveClientBtn.textContent = 'Сохранить';
    $cancelOrDeleteBtn.textContent = !client ? 'Отмена' : 'Удалить клиента';

    $cancelOrDeleteBtn.type = 'button';
    $saveClientBtn.type = 'submit';

    $surnameInp.name = 'surname';
    $nameInp.name = 'name';
    $lastnameInp.name = 'lastname';

    if (client) {
      location.hash = client.id;
      $title.classList.add('popup__title-change');
      $surnameLabel.classList.add('no-empty');
      $nameLabel.classList.add('no-empty');
      $id.textContent = `ID: ${client.id}`;
      $surnameInp.value = client.surname;
      $nameInp.value = client.name;
      if (client.lastName) {
        $lastnameLabel.classList.add('no-empty');
        $lastnameInp.value = client.lastName;
      } else {
        $lastnameInp.value = '';
      };
    };

    $surnameInp.addEventListener('input', () => {
      if ($surnameInp.value !== '') {
        $surnameLabel.classList.add('no-empty');
      } else {
        $surnameLabel.classList.remove('no-empty');
      };
    });
    $nameInp.addEventListener('input', () => {
      if ($nameInp.value !== '') {
        $nameLabel.classList.add('no-empty');
      } else {
        $nameLabel.classList.remove('no-empty');
      };
    });
    $lastnameInp.addEventListener('input', () => {
      if ($lastnameInp.value !== '') {
        $lastnameLabel.classList.add('no-empty');
      } else {
        $lastnameLabel.classList.remove('no-empty');
      };
    });

    $cancelOrDeleteBtn.addEventListener('click', () => {
      if (client) {
        clientDelete(client.id, $popup);
      } else {
        $popup.remove();
      };
    });

    $surnameGroup.append($surnameLabel, $surnameInp);
    $nameGroup.append($nameLabel, $nameInp);
    $lastnameGroup.append($lastnameLabel, $lastnameInp);
    $saveClientBtn.prepend(iconLoad);
    $form.append($surnameGroup, $nameGroup, $lastnameGroup, $contacts, $errors, $saveClientBtn, $cancelOrDeleteBtn);
    $popup.children[0].append($title, $form);
    if (client) $title.after($id);

    return {
      $form,
      $surnameInp,
      $nameInp,
      $errors,
      $saveClientBtn
    };
  };

  function formValidation($form, $surname, $name, $errors) {
    const contactsInpAll = $form.querySelectorAll('.group__inp');
    let errors = [],
      surnameErr = 'Введите фамилию',
      nameErr = 'Введите имя',
      contactsErr = 'Не все добавленные контакты заполнены';

    if ($surname.value.trim() === '') {
      $surname.classList.add('inp-error');
      $surname.parentNode.children[0].classList.add('inp-error');
      $surname.value = '';

      errors.push(surnameErr);
    };

    $surname.addEventListener('input', () => {
      $surname.classList.remove('inp-error');
      $surname.parentNode.children[0].classList.remove('inp-error');

      const index = errors.indexOf(surnameErr);
      if (index >= 0) {
        errors.splice(index, 1);
      };
    });

    if ($name.value.trim() === '') {
      $name.classList.add('inp-error');
      $name.parentNode.children[0].classList.add('inp-error');
      $name.value = '';

      errors.push(nameErr);
    };

    $name.addEventListener('input', () => {
      $name.classList.remove('inp-error');
      $name.parentNode.children[0].classList.remove('inp-error');

      const index = errors.indexOf(nameErr);
      if (index >= 0) {
        errors.splice(index, 1);
      };
    });

    let empty = false;
    contactsInpAll.forEach($contactInp => {
      if ($contactInp.value.trim() === '') {
        $contactInp.classList.add('inp-error');
        $contactInp.parentNode.classList.add('inp-error');
        $contactInp.value = '';

        if (!errors.includes(contactsErr)) {
          errors.push(contactsErr);
        };

        empty = true;
      };

      $contactInp.addEventListener('input', () => {
        $contactInp.classList.remove('inp-error');
        $contactInp.parentNode.classList.remove('inp-error');

        empty = false;
      });

      if (!empty) {
        const index = errors.indexOf(contactsErr);
        console.log(index);
        if (index >= 0) {
          errors.splice(index, 1);
        };
      };
    });

    $errors.innerHTML = '';

    if (errors.length) {
      errors.forEach(error => {
        const $error = document.createElement('p');
        $error.classList.add('error');
        $error.textContent = error;
        $errors.append($error);
      });
      return false;
    } else {
      const formData = getFormData($form);
      return formData;
    };
  };

  // список контактов в форме
  function createContactsList($container, contacts) {
    const
      $contactsList = document.createElement('ul'),
      $addContactBtn = document.createElement('button');

    let contactsArr = [],
      number = 1;

    $contactsList.classList.add('popup__list');
    $addContactBtn.classList.add('popup__add');

    if (contacts) {
      contacts.forEach(contact => {
        contactsArr = createSelect({ clientContact: contact, $contactsList, $container, contactsArr });
      });

      contactsArr.forEach(contact => {
        contact.$select.name = `contactType${number}`;
        contact.$input.name = `contactType${number}`;
        number++;
      });
      number = 1;
    };

    $addContactBtn.type = 'button';
    $addContactBtn.textContent = 'Добавить контакт';

    $addContactBtn.prepend(createSvg('add'));


    // добавление контакта
    $addContactBtn.addEventListener('click', () => {
      contactsArr = createSelect({ $contactsList, $container, contactsArr });

      if (contactsArr) {
        contactsArr.forEach(contact => {
          contact.$select.name = `contactType${number}`;
          contact.$input.name = `contact${number}`;
          number++;
        });
        number = 1;
      };

      function contactDeleteion() {
        this.parentNode.remove();

        contactsArr = contactsArr.filter(oldContact => oldContact.$input.name !== this.parentNode.children[1].name);

        if (contactsArr) {
          contactsArr.forEach(contact => {
            contact.$select.name = `contactType${number}`;
            contact.$input.name = `contact${number}`;
            number++;
          });
          number = 1;
        };

        // если удалены все контакты удаляет лист
        if ($contactsList.children.length === 0) {
          $container.classList.add('empty');
          $contactsList.remove();
        };
      };

      // удаление контакта
      contactsArr.forEach(contact => {
        contact.$deleteBtn.onclick = contactDeleteion;
      });
    });

    $container.append($addContactBtn);
  };

  // создание поля контакта
  function createSelect({ clientContact = null, $contactsList, $container, contactsArr }) {
    const
      $group = document.createElement('li'),
      $select = document.createElement('select'),
      $input = document.createElement('input'),
      $deleteBtn = document.createElement('button'),
      defaultContacts = [
        {
          value: 'Phone',
          label: 'Телефон',
          selected: true
        },
        {
          value: 'Email',
          label: 'Email',
        },
        {
          value: 'Facebook',
          label: 'Facebook',
        },
        {
          value: 'VK',
          label: 'VK',
        },
        {
          value: 'other',
          label: 'Другое',
        },
      ];

    $group.classList.add('popup__group', 'group');
    $input.classList.add('group__inp');
    $deleteBtn.classList.add('group__btn');

    $input.placeholder = window.innerWidth > 576 ? 'Введите данные контакта' : 'Введите данные';

    $input.type = 'text';
    $deleteBtn.type = 'button';

    if (clientContact) {
      const contactIndex = defaultContacts.findIndex(defaultContact => defaultContact.value === clientContact.type);
      $input.value = clientContact.type === 'Phone' ? clientContact.value : clientContact.value;

      if (contactIndex !== -1) {
        defaultContacts[contactIndex].selected = true;
      } else {
        defaultContacts.push({ value: clientContact.type, label: clientContact.type, selected: true });
      };
    };

    $deleteBtn.append(createSvg('delContact'));
    $group.append($select, $input, $deleteBtn);

    const select = new Choices($select, {
      searchEnabled: false,
      allowHTML: false,
      position: 'bottom',
      itemSelectText: '',
      choices: defaultContacts
    });

    // изменение выбора селекта
    $select.addEventListener('choice', () => {
      const oldValue = $select.value;

      // библиотека не успевает сменить значение по этому пришлось дать ей милисекунду😅
      setTimeout(() => {
        const newValue = $select.value;

        // если открыли селект и выбрали не тот же тип контакта то поле отчищается
        if (oldValue !== newValue) $input.value = '';

        // если выбор изменен на 'Другое' то появляется окно с вводом назавния контакта
        if ($select.value === 'other') {
          const
            $contactTypeContainer = document.createElement('div'),
            $descr = document.createElement('p'),
            $inputContactType = document.createElement('input'),
            $addContactTypeBtn = document.createElement('button');

          $contactTypeContainer.classList.add('add-other');
          $inputContactType.classList.add('other__inp');

          $descr.textContent = 'Укажите название контакта (Twitter, Instagram)';
          $addContactTypeBtn.textContent = 'Добавить';

          $addContactTypeBtn.type = 'button';
          $inputContactType.type = 'text';

          $contactTypeContainer.append($descr, $inputContactType, $addContactTypeBtn);
          $container.append($contactTypeContainer);

          $addContactTypeBtn.addEventListener('click', () => {

            // добавление нового типа контакта в список и его выбор
            select.setChoices(
              [
                {
                  value: String($inputContactType.value),
                  label: String($inputContactType.value),
                  selected: true
                },
              ],
              'value',
              'label',
              false,
            );

            $contactTypeContainer.remove();
          });
        };
      }, 1);
    });

    // если это первый контакт добавляет список
    if ($contactsList.children.length === 0) {
      $container.prepend($contactsList);
      $container.classList.remove('empty');
    };

    contactsArr.push({ $group, $select, $input, $deleteBtn });
    $contactsList.append($group);

    // если контактов 10 удаляет кнопку
    if ($contactsList.children.length >= 10) {
      $addContactBtn.remove();
    };

    return contactsArr;
  };

  // преобразование дат
  function getCorrectDateString(date) {
    const correctDate = new Date(date);
    return {
      date: ('0' + correctDate.getDate()).slice(-2) + '.' + ('0' + (correctDate.getMonth() + 1)).slice(-2) + '.' + correctDate.getFullYear(),
      time: ('0' + correctDate.getHours()).slice(-2) + ':' + ('0' + correctDate.getMinutes()).slice(-2)
    };
  };

  // создание строки в таблице
  function newClientTR(client) {
    const
      $clientsTR = document.createElement('tr'),
      $idTD = document.createElement('td'),
      $fioTD = document.createElement('td'),
      $createdAtTD = document.createElement('td'),
      $updatedAtTD = document.createElement('td'),
      $contactsAtTD = document.createElement('td'),
      $contactsList = document.createElement('ul'),
      $actionsTD = document.createElement('td'),
      $createdTime = document.createElement('span'),
      $updatedTime = document.createElement('span'),
      $btnGroup = document.createElement('div'),
      $btnChange = document.createElement('button'),
      $btnDelete = document.createElement('button'),
      classTR = 'table__tr',
      classTD = 'table__td',
      $iconChange = createSvg('change'),
      $iconLoad = createSpinner('btn');

    $clientsTR.classList.add(classTR);
    $clientsTR.dataset.id = client.id;
    $idTD.classList.add(classTD, 'table__id');
    $fioTD.classList.add(classTD, 'table__fio');
    $createdAtTD.classList.add(classTD, 'table__date');
    $updatedTime.classList.add('time');
    $updatedAtTD.classList.add(classTD, 'table__date');
    $createdTime.classList.add('time');
    $contactsAtTD.classList.add(classTD);
    $actionsTD.classList.add(classTD);
    $contactsList.classList.add('contacts-list');
    $btnGroup.classList.add('btn-group');
    $btnChange.classList.add('btn-change');
    $btnDelete.classList.add('btn-delete');

    $idTD.textContent = client.id;
    $fioTD.textContent = client.fio;
    $createdAtTD.textContent = client.createdAtString.date;
    $createdTime.textContent = client.createdAtString.time;
    $updatedAtTD.textContent = client.updatedAtString.date;
    $updatedTime.textContent = client.updatedAtString.time;
    $btnChange.textContent = 'Изменить';
    $btnDelete.textContent = 'Удалить';

    $btnChange.prepend($iconChange);
    $btnDelete.prepend(createSvg('delClient'));

    const contactsMapped = client.contacts.map((el, i) => {
      return { index: i, type: el.type };
    });

    // сортировка списка контактов
    contactsMapped.sort((a, b) => {
      if (a.type === 'VK' || a.type === 'Facebook' || a.type === 'Phone' || a.type === 'Email') {
        if (a.type === 'VK' && b.type !== 'VK' && a.index > b.index) {
          return -1;
        } else if (a.type === 'Facebook' && b.type !== 'Facebook' && b.type !== 'VK' && a.index > b.index) {
          return -1;
        } else if (a.type === 'Phone' && b.type !== 'Phone' && b.type !== 'Facebook' && b.type !== 'VK' && a.index > b.index) {
          return -1;
        } else if (a.type === 'Email' && b.type !== 'Email' && b.type !== 'Phone' && b.type !== 'Facebook' && b.type !== 'VK' && a.index > b.index) {
          return -1;
        } else {
          return 1;
        };
      } else {
        return 1;
      };
    });

    const contactsSort = contactsMapped.map(el => { return client.contacts[el.index] });

    let tooltips = [];
    contactsSort.forEach(contact => {
      const
        $tooltip = document.createElement('li'),
        $tooltipBtn = document.createElement('button'),
        $tooltipMoreBtn = document.createElement('button'),
        $tooltipLink = document.createElement('a'),
        $tooltipText = document.createElement('div');

      $tooltip.classList.add('tooltip');
      $tooltipBtn.classList.add('tooltip__btn');
      $tooltipText.classList.add('tooltip__text');
      $tooltipMoreBtn.classList.add('tooltip', 'tooltip__more');
      $tooltipLink.classList.add('tooltip__link');

      $tooltipMoreBtn.textContent = `+${contactsSort.length - 4}`;
      $tooltipText.role = 'tooltip';
      $tooltipText.id = `contactDescr${contactNumber}`;
      $tooltipBtn.setAttribute('aria-describedby', $tooltipText.id);

      tooltips.push($tooltip);

      if (contactNumber === 5) {
        $contactsList.append($tooltipMoreBtn);
      };

      if (contactNumber > 4) {
        $tooltip.classList.add('hid');
      };

      $tooltipMoreBtn.addEventListener('click', function () {
        tooltips.forEach(tooltip => {
          tooltip.classList.remove('hid');
          tooltip.classList.add('full');
        });
        this.remove();
      });

      if (contact.type === 'VK' || contact.type === 'Phone' || contact.type === 'Facebook' || contact.type === 'Email') {
        $tooltipLink.textContent = contact.value;
        if (contact.type === 'Phone') {
          $tooltipLink.href = `tel:${contact.value.replace(/[^+\d]/g, '')}`;
        } else if (contact.type === 'Email') {
          $tooltipLink.href = `mailto:${contact.value}`;
        } else {
          $tooltipLink.href = contact.value;
        };
      } else {
        $tooltipText.textContent = `${contact.type}: `;
        $tooltipLink.textContent = contact.value;
        $tooltipLink.href = contact.value;
        $tooltipLink.classList.add('other');
      };

      $tooltipBtn.append(createSvg(contact.type));
      $tooltipText.append($tooltipLink);
      $tooltip.append($tooltipBtn, $tooltipText);
      $contactsList.append($tooltip);

      contactNumber++;
    });

    contactNumber = 1;

    $btnChange.addEventListener('click', () => {
      $btnChange.classList.add('load');
      $iconChange.remove();
      $btnChange.prepend($iconLoad);

      clientChange(client.id, $btnChange, $iconLoad, $iconChange);
    });
    $btnDelete.addEventListener('click', () => {
      clientDelete(client.id);
    });

    $btnGroup.append($btnChange, $btnDelete);
    $actionsTD.append($btnGroup);
    $createdAtTD.append($createdTime);
    $updatedAtTD.append($updatedTime);
    $contactsAtTD.append($contactsList);
    $clientsTR.append($idTD, $fioTD, $createdAtTD, $updatedAtTD, $contactsAtTD, $actionsTD);

    return $clientsTR;
  };

  // изменение клиента
  async function clientChange(id, $btn, $iconLoad, $iconChange) {
    const client = await getClients({ id: id });

    if (client && $btn) {
      $btn.classList.remove('load');
      $iconLoad.remove();
      $btn.prepend($iconChange);
    };

    const $popup = createPopup();
    const { $form, $surnameInp, $nameInp, $errors, $saveClientBtn } = createModalAddOrChangeClient($popup, client);

    $form.addEventListener('submit', async event => {
      event.preventDefault();

      const formData = formValidation($form, $surnameInp, $nameInp, $errors);

      if (formData) {
        $saveClientBtn.classList.add('load');
        $popup.classList.add('load');

        const response = await fetch(`${URL_API}/${client.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          location.hash = '';

          $saveClientBtn.classList.remove('load');
          $popup.classList.remove('load');

          $popup.remove();
          render();
        };
      };
    });
  };

  // добавление клиента
  async function addClient(client, $popup, $saveClientBtn) {
    const response = await fetch(URL_API, {
      method: 'POST',
      body: JSON.stringify(client),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    $saveClientBtn.classList.remove('load');
    $popup.classList.remove('load');

    if (response.status === 404 || response.status >= 500) {
      return ['Что-то пожно не так...'];
    };

    if (response.ok) {
      $popup.remove();
      render();
    };
  };

  // удаление клиента
  function clientDelete(id, $popup) {
    const $deletePopup = createPopup();
    const $deleleBtn = createModalConfirmDeletion($deletePopup);

    $deleleBtn.addEventListener('click', async () => {
      const response = await fetch(`${URL_API}/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        location.hash = '';

        $deletePopup.remove();
        if ($popup) {
          $popup.remove();
        };

        render();
      };
    });
  };

  // фон и модальное окно с кнопкой закрытия
  function createPopup() {
    const
      $popupFade = document.createElement('div'),
      $popup = document.createElement('div'),
      $popupCloseBtn = document.createElement('button'),
      $body = document.querySelector('body');

    $popupFade.classList.add('popup');
    $popup.classList.add('popup__content');
    $popupCloseBtn.classList.add('popup__close');
    $body.classList.add('no-scroll');

    addEventListener('click', event => {
      if (event.target == $popupFade) {
        location.hash = '';

        $body.classList.remove('no-scroll');
        $popupFade.remove();
      };
    });

    $popupCloseBtn.addEventListener('click', () => {
      location.hash = '';

      $body.classList.remove('no-scroll');
      $popupFade.remove();
    });

    $popupCloseBtn.append(createSvg('cross'));

    $popup.append($popupCloseBtn);
    $popupFade.append($popup);
    document.body.append($popupFade);

    return $popupFade;
  };

  // модальное окно подтверждения удаления
  function createModalConfirmDeletion($popup) {
    const
      $wrap = document.createElement('div'),
      $popupTitle = document.createElement('h2'),
      $popupDescr = document.createElement('p'),
      $popupDeleteBtn = document.createElement('button'),
      $popupCancelBtn = document.createElement('button');

    $wrap.classList.add('popup__delete');
    $popupTitle.classList.add('popup__title');
    $popupDescr.classList.add('popup__descr');
    $popupDeleteBtn.classList.add('firm-btn', 'popop__delete-btn');
    $popupCancelBtn.classList.add('popup__cancel-delete');

    $popupTitle.textContent = 'Удалить клиента';
    $popupDescr.textContent = 'Вы действительно хотите удалить данного клиента?';
    $popupDeleteBtn.textContent = 'Удалить';
    $popupCancelBtn.textContent = 'Отмена';

    $wrap.append($popupTitle, $popupDescr, $popupDeleteBtn, $popupCancelBtn);

    $popupCancelBtn.addEventListener('click', () => {
      $popup.remove();
    });

    $popup.children[0].append($wrap);

    return $popupDeleteBtn;
  };

  // свг
  function createSvg(type) {
    const xmlns = 'http://www.w3.org/2000/svg',
      svg = document.createElementNS(xmlns, 'svg'),
      path = document.createElementNS(xmlns, 'path'),
      circle = document.createElementNS(xmlns, 'circle');

    let
      width, height, pathAttribute, fill, fillTwo, rule = false;

    svg.classList.add('icon');

    if (type === 'add') {
      width = 14;
      height = 14;
      pathAttribute = 'M6.99998 3.66668C6.63331 3.66668 6.33331 3.96668 6.33331 4.33334V6.33334H4.33331C3.96665 6.33334 3.66665 6.63334 3.66665 7.00001C3.66665 7.36668 3.96665 7.66668 4.33331 7.66668H6.33331V9.66668C6.33331 10.0333 6.63331 10.3333 6.99998 10.3333C7.36665 10.3333 7.66665 10.0333 7.66665 9.66668V7.66668H9.66665C10.0333 7.66668 10.3333 7.36668 10.3333 7.00001C10.3333 6.63334 10.0333 6.33334 9.66665 6.33334H7.66665V4.33334C7.66665 3.96668 7.36665 3.66668 6.99998 3.66668ZM6.99998 0.333344C3.31998 0.333344 0.333313 3.32001 0.333313 7.00001C0.333313 10.68 3.31998 13.6667 6.99998 13.6667C10.68 13.6667 13.6666 10.68 13.6666 7.00001C13.6666 3.32001 10.68 0.333344 6.99998 0.333344ZM6.99998 12.3333C4.05998 12.3333 1.66665 9.94001 1.66665 7.00001C1.66665 4.06001 4.05998 1.66668 6.99998 1.66668C9.93998 1.66668 12.3333 4.06001 12.3333 7.00001C12.3333 9.94001 9.93998 12.3333 6.99998 12.3333Z';
      fill = '#9873FF';
    } else if (type === 'delContact') {
      width = 12;
      height = 12;
      pathAttribute = 'M6 0C2.682 0 0 2.682 0 6C0 9.318 2.682 12 6 12C9.318 12 12 9.318 12 6C12 2.682 9.318 0 6 0ZM6 10.8C3.354 10.8 1.2 8.646 1.2 6C1.2 3.354 3.354 1.2 6 1.2C8.646 1.2 10.8 3.354 10.8 6C10.8 8.646 8.646 10.8 6 10.8ZM8.154 3L6 5.154L3.846 3L3 3.846L5.154 6L3 8.154L3.846 9L6 6.846L8.154 9L9 8.154L6.846 6L9 3.846L8.154 3Z';
      fill = '#B0B0B0';
    } else if (type === 'change') {
      width = 13;
      height = 13;
      pathAttribute = 'M0 10.5002V13.0002H2.5L9.87333 5.62687L7.37333 3.12687L0 10.5002ZM11.8067 3.69354C12.0667 3.43354 12.0667 3.01354 11.8067 2.75354L10.2467 1.19354C9.98667 0.933535 9.56667 0.933535 9.30667 1.19354L8.08667 2.41354L10.5867 4.91354L11.8067 3.69354Z';
      fill = '#9873FF';
    } else if (type === 'delClient') {
      width = 12;
      height = 12;
      pathAttribute = 'M6 0C2.682 0 0 2.682 0 6C0 9.318 2.682 12 6 12C9.318 12 12 9.318 12 6C12 2.682 9.318 0 6 0ZM6 10.8C3.354 10.8 1.2 8.646 1.2 6C1.2 3.354 3.354 1.2 6 1.2C8.646 1.2 10.8 3.354 10.8 6C10.8 8.646 8.646 10.8 6 10.8ZM8.154 3L6 5.154L3.846 3L3 3.846L5.154 6L3 8.154L3.846 9L6 6.846L8.154 9L9 8.154L6.846 6L9 3.846L8.154 3Z';
      fill = '#F06A4D';
    } else if (type === 'cross') {
      width = 17;
      height = 17;
      pathAttribute = 'M16.2332 1.73332L15.2665 0.766649L8.49985 7.53334L1.73318 0.766681L0.766515 1.73335L7.53318 8.50001L0.766542 15.2667L1.73321 16.2333L8.49985 9.46668L15.2665 16.2333L16.2332 15.2667L9.46651 8.50001L16.2332 1.73332Z';
      fill = '#B0B0B0';
      rule = true;
    } else {
      width = 16;
      height = 16;
      fill = '#9873FF';

      if (type === 'VK') {
        pathAttribute = 'M8 0C3.58187 0 0 3.58171 0 8C0 12.4183 3.58187 16 8 16C12.4181 16 16 12.4183 16 8C16 3.58171 12.4181 0 8 0ZM12.058 8.86523C12.4309 9.22942 12.8254 9.57217 13.1601 9.97402C13.3084 10.1518 13.4482 10.3356 13.5546 10.5423C13.7065 10.8371 13.5693 11.1604 13.3055 11.1779L11.6665 11.1776C11.2432 11.2126 10.9064 11.0419 10.6224 10.7525C10.3957 10.5219 10.1853 10.2755 9.96698 10.037C9.87777 9.93915 9.78382 9.847 9.67186 9.77449C9.44843 9.62914 9.2543 9.67366 9.1263 9.90707C8.99585 10.1446 8.96606 10.4078 8.95362 10.6721C8.93577 11.0586 8.81923 11.1596 8.43147 11.1777C7.60291 11.2165 6.81674 11.0908 6.08606 10.6731C5.44147 10.3047 4.94257 9.78463 4.50783 9.19587C3.66126 8.04812 3.01291 6.78842 2.43036 5.49254C2.29925 5.2007 2.39517 5.04454 2.71714 5.03849C3.25205 5.02817 3.78697 5.02948 4.32188 5.03799C4.53958 5.04143 4.68362 5.166 4.76726 5.37142C5.05633 6.08262 5.4107 6.75928 5.85477 7.38684C5.97311 7.55396 6.09391 7.72059 6.26594 7.83861C6.45582 7.9689 6.60051 7.92585 6.69005 7.71388C6.74734 7.57917 6.77205 7.43513 6.78449 7.29076C6.82705 6.79628 6.83212 6.30195 6.75847 5.80943C6.71263 5.50122 6.53929 5.30218 6.23206 5.24391C6.07558 5.21428 6.0985 5.15634 6.17461 5.06697C6.3067 4.91245 6.43045 4.81686 6.67777 4.81686L8.52951 4.81653C8.82136 4.87382 8.88683 5.00477 8.92645 5.29874L8.92808 7.35656C8.92464 7.47032 8.98521 7.80751 9.18948 7.88198C9.35317 7.936 9.4612 7.80473 9.55908 7.70112C10.0032 7.22987 10.3195 6.67368 10.6029 6.09801C10.7279 5.84413 10.8358 5.58142 10.9406 5.31822C11.0185 5.1236 11.1396 5.02785 11.3593 5.03112L13.1424 5.03325C13.195 5.03325 13.2483 5.03374 13.3004 5.04274C13.6009 5.09414 13.6832 5.22345 13.5903 5.5166C13.4439 5.97721 13.1596 6.36088 12.8817 6.74553C12.5838 7.15736 12.2661 7.55478 11.9711 7.96841C11.7001 8.34652 11.7215 8.53688 12.058 8.86523Z';
      } else if (type === 'Facebook') {
        pathAttribute = 'M7.99999 0C3.6 0 0 3.60643 0 8.04819C0 12.0643 2.928 15.3976 6.75199 16V10.3775H4.71999V8.04819H6.75199V6.27309C6.75199 4.25703 7.94399 3.14859 9.77599 3.14859C10.648 3.14859 11.56 3.30121 11.56 3.30121V5.28514H10.552C9.55999 5.28514 9.24799 5.90362 9.24799 6.53815V8.04819H11.472L11.112 10.3775H9.24799V16C11.1331 15.7011 12.8497 14.7354 14.0879 13.2772C15.3261 11.819 16.0043 9.96437 16 8.04819C16 3.60643 12.4 0 7.99999 0Z';
      } else if (type === 'Phone') {
        pathAttribute = 'M11.56 9.50222C11.0133 9.50222 10.4844 9.41333 9.99111 9.25333C9.83556 9.2 9.66222 9.24 9.54222 9.36L8.84444 10.2356C7.58667 9.63556 6.40889 8.50222 5.78222 7.2L6.64889 6.46222C6.76889 6.33778 6.80444 6.16444 6.75556 6.00889C6.59111 5.51556 6.50667 4.98667 6.50667 4.44C6.50667 4.2 6.30667 4 6.06667 4H4.52889C4.28889 4 4 4.10667 4 4.44C4 8.56889 7.43556 12 11.56 12C11.8756 12 12 11.72 12 11.4756V9.94222C12 9.70222 11.8 9.50222 11.56 9.50222Z';
        fillTwo = fill;
        fill = '#fff';

        svg.append(circle);
      } else if (type === 'Email') {
        pathAttribute = 'M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM4 5.75C4 5.3375 4.36 5 4.8 5H11.2C11.64 5 12 5.3375 12 5.75V10.25C12 10.6625 11.64 11 11.2 11H4.8C4.36 11 4 10.6625 4 10.25V5.75ZM8.424 8.1275L11.04 6.59375C11.14 6.53375 11.2 6.4325 11.2 6.32375C11.2 6.0725 10.908 5.9225 10.68 6.05375L8 7.625L5.32 6.05375C5.092 5.9225 4.8 6.0725 4.8 6.32375C4.8 6.4325 4.86 6.53375 4.96 6.59375L7.576 8.1275C7.836 8.28125 8.164 8.28125 8.424 8.1275Z';
        rule = true;
      } else {
        pathAttribute = 'M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM3 8C3 5.24 5.24 3 8 3C10.76 3 13 5.24 13 8C13 10.76 10.76 13 8 13C5.24 13 3 10.76 3 8ZM9.5 6C9.5 5.17 8.83 4.5 8 4.5C7.17 4.5 6.5 5.17 6.5 6C6.5 6.83 7.17 7.5 8 7.5C8.83 7.5 9.5 6.83 9.5 6ZM5 9.99C5.645 10.96 6.75 11.6 8 11.6C9.25 11.6 10.355 10.96 11 9.99C10.985 8.995 8.995 8.45 8 8.45C7 8.45 5.015 8.995 5 9.99Z';
        rule = true;
      };
    };

    svg.setAttributeNS(null, 'viewBox', '0 0 ' + width + ' ' + height);
    svg.setAttributeNS(null, 'width', width);
    svg.setAttributeNS(null, 'height', height);
    svg.setAttributeNS(null, 'fill', 'none');
    svg.setAttributeNS(null, 'xmls', xmlns);

    circle.setAttributeNS(null, 'cx', '8');
    circle.setAttributeNS(null, 'cy', '8');
    circle.setAttributeNS(null, 'r', '8');
    circle.setAttributeNS(null, 'fill', fillTwo);

    if (rule) {
      path.setAttributeNS(null, 'fill-rule-width', 'evenodd');
      path.setAttributeNS(null, 'clip-rule', 'evenodd');
    };
    path.setAttributeNS(null, 'd', pathAttribute);
    path.setAttributeNS(null, 'fill', fill);

    svg.append(path);

    return svg;
  };

  // получить полное имя
  function getFio(client) {
    return client.surname + ' ' + client.name + ' ' + client.lastName;
  };

  // сортировка
  function getSortClients(prop, dir, clients) {
    return clients.sort((clientA, clientB) => {
      if (!dir === false ? clientA[prop] < clientB[prop] : clientA[prop] > clientB[prop])
        return -1;
    });
  };

  // события сортировки
  $sortBtnAll.forEach(btn => {
    if (btn.dataset.column === sortProperty) btn.classList.add(sortDir ? 'increase' : 'decrease');

    btn.addEventListener('click', function () {
      sortProperty = this.dataset.column;
      sortDir = !sortDir;

      $sortBtnAll.forEach(btn => btn.classList.remove('increase', 'decrease'));
      this.classList.add(sortDir ? 'increase' : 'decrease');

      render();
    });
  });

  $search.addEventListener('input', function () {
    $searchResult.innerHTML = '';
    $searchResult.classList.add('empty');

    window.addEventListener('click', event => {
      if (event.target !== $searchForm) {
        $searchResult.innerHTML = '';
        $searchResult.classList.add('empty');
      };
    });

    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      if (this.value.trim() !== '') {
        const clientsSearch = await getClients({ search: this.value });
        createSearchResult(this, clientsSearch);
        render();
      };
    }, 300);
  });

  function createSearchResult($input, clientsArr) {
    const $noResult = document.createElement('p');
    let arrayControls = [$input], focusIndex = 0;

    $noResult.textContent = 'Клиента с такими данными нет';

    $searchResult.classList.remove('empty');
    if (clientsArr.length) {
      clientsArr.forEach(client => {
        const $clientEl = document.createElement('li'),
          $client = document.createElement('button');

        $clientEl.classList.add('list-result__elem');
        $client.classList.add('list-result__client');

        $client.type = 'button';
        $client.dataset.id = client.id;
        $client.textContent = `${client.surname} ${client.name} ${client.lastName ? client.lastName : ''}`;

        $client.addEventListener('click', function () {
          $input.value = '';
          $searchResult.innerHTML = '';
          $searchResult.classList.add('empty');

          const $thisClientTR = document.querySelector(`.table__tr[data-id="${this.dataset.id}"]`),
            thisClientTRPosition = window.pageYOffset + $thisClientTR.getBoundingClientRect().bottom,
            windowPosition = window.pageYOffset + document.documentElement.clientHeight;

          $thisClientTR.style.backgroundColor = 'rgba(34, 167, 59, .4)';

          // если строка таблицы не в зоне видимости то скроллит до неё
          if (thisClientTRPosition > windowPosition) {
            $thisClientTR.scrollIntoView({ block: 'center', behavior: 'smooth' });
          };
        });

        $clientEl.append($client);
        $searchResult.append($clientEl);

        arrayControls.push($client);
      });
    } else {
      $searchResult.append($noResult);
    };

    $searchForm.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' && focusIndex <= arrayControls.length - 2) {
        focusIndex++;
        arrayControls[focusIndex].focus();
      } else if (event.key === 'ArrowUp' && focusIndex > 0) {
        focusIndex--;
        arrayControls[focusIndex].focus();
      };
    });
  };


  // отрисовка таблицы
  async function render() {
    let clients = await getClients({});

    if (clients) {
      $clientsList.classList.remove('load');
      $spinner.remove();
    };

    clients.forEach(client => {
      client.fio = getFio(client);
      client.createdAtString = getCorrectDateString(client.createdAt);
      client.updatedAtString = getCorrectDateString(client.updatedAt);
    });

    clients = getSortClients(sortProperty, sortDir, clients);


    $clientsList.innerHTML = '';
    clients.forEach(client => {
      $clientsList.append(newClientTR(client));
    });
  };
})();
