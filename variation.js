(function () {
  'use strict';

  var shared = {
      ID: "FE-Card-Opt",
      VARIATION: "1",
      CLIENT: "zoom"
    };

  const setup = () => {
    const { ID, VARIATION } = shared;
    document.documentElement.classList.add(ID);
    document.documentElement.classList.add(`${ID}-${VARIATION}`);
  };

  const loader = (id) => {
    const htmlStr = `
    <div class="${id}__loader">
    <svg class="circular" viewBox="25 25 50 50" role="button" aria-label="loading" tabindex="0">
      <circle class="path" cx="50" cy="50" r="20" fill="none"></circle>
    </svg>

    </div>`;
    return htmlStr;
  };

  const price = (id, val, payFreq = 'year') => {
    const formattedPrice = val.split('.')[0];
    const htmlStr = `
    <div aria-label="$${formattedPrice} per ${payFreq}" class="${id}__newprice new-price">
        <div>
            <div>
                <div class="price-part">
                    <span class="subtext currency-flag">$</span>
                    <div class="price-num">
                        ${formattedPrice}<span class="flag-hidden">.</span><span class="subtext">00</span>
                    </div>
                </div>
                <span class="rate">/${payFreq}</span>
            </div>
        </div>
    </div>

    `;
    return htmlStr;
  };

  /*eslint-disable object-curly-newline */
  /*eslint-disable no-console */
  /*eslint-disable max-len */
  /**
   * Polls the DOM for a condition to be met before executing a callback.
   *
   * @param {array} conditions The array of conditions to check for.
   * @param {function} callback The callback function when all conditions are true.
   * @param {number} maxTime max time the check witll run before abort.
   */
  const pollerLite = (conditions, callback, maxTime = 10000) => {
    const POLLING_INTERVAL = 25;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const allConditionsMet = conditions.every((condition) => {
        if (typeof condition === 'function') {
          return condition();
        }
        return !!document.querySelector(condition);
      });
      if (allConditionsMet) {
        clearInterval(interval);
        callback();
      } else if (Date.now() - startTime >= maxTime) {
        clearInterval(interval);
        console.error('Polling exceeded maximum time limit');
      }
    }, POLLING_INTERVAL);
  };

  const waitFor = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  const sendCustomEvent = (eventName, eventData) => {
    const customEvent = new CustomEvent(eventName, { detail: eventData });
    document.dispatchEvent(customEvent);
  };

  const changeAttendeCount = (count = '500') => {
    pollerLite([`[aria-label="${count} attendees"]`], () => {
      const attendeeCountElem = document.querySelector(`[aria-label="${count} attendees"]`);
      attendeeCountElem.click();
    });
  };

  const getPaymentPlan = () => {
    const plan = document.getElementById('zm-radio-group0-radio-1').checked
      ? 'subscription'
      : 'payperattendee';
    return plan;
  };

  /*eslint-disable object-curly-newline */

  const getEventsData = (eventType = null) => {
    const eventNameConfig = {
      webinar: 0,
      sessions: 1,
      events: 2
    };

    const data = [];
    const eventElems = document.querySelectorAll('.webinar-plans-new');
    const payPlan = getPaymentPlan();
    const activeAttendeeCount = document.querySelector(
      '.filter-num-container .item.active .label'
    ).innerText;

    eventElems.forEach((eventElem, index) => {
      if (index === 0 && (payPlan === 'payperattendee' || activeAttendeeCount === '100')) {
        data.push({});
        return;
      }

      const priceAnnualElem = eventElem.querySelector('.price-num');
      const btnElem = eventElem.querySelector('.buy-plan-link');

      const priceAnnual = priceAnnualElem ? priceAnnualElem.textContent : '';
      const btnUrl = btnElem.getAttribute('href');
      const btnClass = btnElem.getAttribute('class');
      const btnText = btnElem.textContent;
      data.push({
        priceAnnual,
        btnUrl,
        btnText,
        btnClass
      });
    });

    return data[eventNameConfig[eventType]] || data;
  };

  const getMonthlyPrice = async () => {
    const DOM_RENDER_DELAY = 1000;
    const monthlyRadioBtn = document.querySelector('[for="zm-radio-group0-radio-2"]');
    const activeAttendeeCount = document.querySelector(
      '.filter-num-container .item.active .label'
    ).innerText;
    monthlyRadioBtn.click();
    await waitFor(DOM_RENDER_DELAY);

    changeAttendeCount(activeAttendeeCount);
    await waitFor(DOM_RENDER_DELAY);
    const priceMonthlyElem = document.querySelector('.webinar-card-bottom .price-num');
    const priceMonthly = priceMonthlyElem ? priceMonthlyElem.textContent : '';

    document.getElementById('zm-radio-group0-radio-1').click();
    changeAttendeCount(activeAttendeeCount);
    return priceMonthly;
  };

  const { ID: ID$4 } = shared;

  const attendeeUpdateHandler = async (event) => {
    //console.log('Custom event received!', event.detail);
    const { eventtype, value } = event.detail;
    //set attendee count
    changeAttendeCount(value);
    //get annual data for the attende count
    const DOM_RENDER_DELAY = 1000;
    const payPlan = getPaymentPlan();
    await waitFor(DOM_RENDER_DELAY);

    const priceAndBtnData = getEventsData(eventtype);

    const { btnUrl, btnClass, btnText, priceAnnual } = priceAndBtnData;

    const parentCard = document.querySelector(`.${ID$4}__eventcard[data-eventtype="${eventtype}"]`);
    //update annual price and button url
    const priceElem = parentCard.querySelector('.price-annual');
    priceElem.classList.remove(`${ID$4}__hide`);
    if (!priceAnnual) {
      priceElem.classList.add(`${ID$4}__hide`);
    }
    priceElem.innerHTML = price(ID$4, priceAnnual);
    const btnElem = parentCard.querySelector('a');
    btnElem.href = btnUrl;
    btnElem.setAttribute('class', btnClass);
    btnElem.innerHTML = btnText;

    if (payPlan === 'payperattendee' || eventtype !== 'webinar') {
      return;
    }

    const monthlyPriceElem = document.querySelector('.price-monthly.webinar');
    monthlyPriceElem.classList.remove(`${ID$4}__hide`);
    monthlyPriceElem.innerHTML = loader(ID$4);
    const monthPrice = await getMonthlyPrice();

    if (!monthPrice || !priceAnnual) {
      monthlyPriceElem.classList.add(`${ID$4}__hide`);
    }
    monthlyPriceElem.innerHTML = price(ID$4, monthPrice, 'month');
  };

  const dropdownToggleHandler = (target) => {
    const dpBtn = target.closest('.dp-selected');
    const dpItems = target.closest('.dp-items');

    if (!dpBtn && !dpItems) {
      document.querySelectorAll('.dp-items').forEach((dp) => dp.classList.remove('active'));
    } else if (target.closest('.dp-selected')) {
      const dp = target.closest('.dp-selected').nextElementSibling;
      dp.classList.toggle('active');
    } else if (target.closest('.dp-item')) {
      const lastParentElem = target.closest('.attendee-dropdown');
      const dpList = target.closest('.dp-items');
      const dpBtnLabel = lastParentElem.querySelector('.dp-label');
      const { eventtype } = lastParentElem.dataset;
      const { value } = target.dataset;
      const planType = getPaymentPlan();

      dpList
        .querySelectorAll('.dp-item')
        .forEach((dpItem) => dpItem.classList.remove('same-as-selected'));
      target.classList.add('same-as-selected');
      dpList.classList.remove('active');
      dpBtnLabel.innerText = parseInt(value) > 3000 && planType === 'subscription' ? '3000+' : value;
      //eslint-disable-next-line object-curly-newline
      sendCustomEvent('attendee-update', { eventtype, value });
    }
  };

  const tick = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
<path d="M11.3463 1.29941C7.60101 3.61721 5.1383 7.40091 5.1385 11.7006C5.1385 9.24491 3.5405 7.03801 1 5.51681" stroke="#0B5CFF" stroke-width="2.0157" stroke-linejoin="bevel"/>
</svg>`;

  const downArrow = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
<path fill-rule="evenodd" clip-rule="evenodd" d="M12.4419 5.55806C12.686 5.80214 12.686 6.19786 12.4419 6.44194L8.44194 10.4419C8.19786 10.686 7.80214 10.686 7.55806 10.4419L3.55806 6.44194C3.31398 6.19786 3.31398 5.80214 3.55806 5.55806C3.80214 5.31398 4.19786 5.31398 4.44194 5.55806L8 9.11612L11.5581 5.55806C11.8021 5.31398 12.1979 5.31398 12.4419 5.55806Z" fill="#0B5CFF"/>
</svg>`;

  const close = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
<mask id="mask0_636_279164" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
<path d="M0.853553 0.146447C0.658291 -0.0488155 0.341709 -0.0488155 0.146447 0.146447C-0.0488155 0.341709 -0.0488155 0.658291 0.146447 0.853553L7.29289 8L0.146447 15.1464C-0.0488155 15.3417 -0.0488155 15.6583 0.146447 15.8536C0.341709 16.0488 0.658291 16.0488 0.853553 15.8536L8 8.70711L15.1464 15.8536C15.3417 16.0488 15.6583 16.0488 15.8536 15.8536C16.0488 15.6583 16.0488 15.3417 15.8536 15.1464L8.70711 8L15.8536 0.853553C16.0488 0.658291 16.0488 0.341709 15.8536 0.146447C15.6583 -0.0488155 15.3417 -0.0488155 15.1464 0.146447L8 7.29289L0.853553 0.146447Z" fill="#000001"/>
</mask>
<g mask="url(#mask0_636_279164)">
<rect width="16" height="16" fill="#131619"/>
</g>
</svg>`;
  const tooltip = '<i class="zm-icon-info-outline fe-tooltip"></i>';
  const zoomTick = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
<g clip-path="url(#clip0_636_279068)">
  <mask
    id="mask0_636_279068"
    style="mask-type: alpha"
    maskUnits="userSpaceOnUse"
    x="0"
    y="1"
    width="16"
    height="14">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M15.6294 2.0147C16.0947 2.4412 16.1261 3.16414 15.6996 3.62941L6.27104 13.9151C6.05457 14.1513 5.74893 14.2857 5.42858 14.2857C5.10823 14.2857 4.80258 14.1513 4.58612 13.9151L0.300402 9.2398C-0.126104 8.77453 -0.0946717 8.05159 0.370607 7.62509C0.835886 7.19858 1.55882 7.23001 1.98533 7.69529L5.42858 11.4516L14.0147 2.0849C14.4412 1.61962 15.1641 1.58819 15.6294 2.0147Z"
      fill="black"
    />
  </mask>
  <g mask="url(#mask0_636_279068)">
    <rect width="16" height="16" fill="#0B5CFF" />
  </g>
</g>
<defs>
  <clipPath id="clip0_636_279068">
    <rect width="16" height="16" fill="white" />
  </clipPath>
</defs>
</svg>`;
  const dash = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="1" viewBox="0 0 16 1" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0.5C0 0.223858 0.223858 0 0.5 0H15.5C15.7761 0 16 0.223858 16 0.5C16 0.776142 15.7761 1 15.5 1H0.5C0.223858 1 0 0.776142 0 0.5Z" fill="#666487"/>
  </svg>`;

  const getAttendeeOptions = () => {
    const attendeOptions = document.querySelectorAll('.filter-num-container .item');
    const options = [];
    attendeOptions.forEach((option) => {
      const optionText = option.querySelector('.label').innerText;
      options.push(optionText);
    });
    return options;
  };

  const dropdown = (id, dropdownItems) => {
    const htmlStr = `
    <div class="${id}__custom-dp">
        <div class="dp-selected dp-arrow-active">
            <div class="dp-label">${dropdownItems[0]}</div>
            <div class="dp-arrow">${downArrow}</div>
        </div>
        <div class="dp-items">
            ${dropdownItems
              .map(
                (item, i) =>
                  `<div class="dp-item ${i === 0 ? 'same-as-selected' : ''}" 
                        data-value="${item}">
                        ${dropdownItems.length === i + 1 ? `${dropdownItems[i - 1]}+` : item}
                    </div>`
              )
              .join('\n')} 
           
        </div>
    </div>`;
    return htmlStr;
  };

  const eventCard = (id, data) => {
    const { title, subtitle, featureHeadline, attendeeText, features, eventType } = data;

    const attendeeOptions = getAttendeeOptions();
    const priceAndBtnData = getEventsData(eventType);
    const { btnUrl, btnClass, btnText, priceAnnual } = priceAndBtnData;

    const planType = getPaymentPlan();

    const modifiedAttendeeOptions =
      planType === 'subscription'
        ? attendeeOptions.filter((item) => parseInt(item) <= 5000)
        : attendeeOptions;

    const monthlyPriceDom = `<div class="price-monthly ${eventType}">${loader(id)}</div>`;
    const dropdownItems =
      eventType === 'webinar' ? modifiedAttendeeOptions.slice(1) : modifiedAttendeeOptions;
    const htmlStr = `  
    <div class="${id}__eventcard" data-eventtype="${eventType}">
    <div class="title">Zoom ${title}</div>
    <div class="subtitle">${subtitle}</div>
    <div class="attendee-wrapper">
        <div class="attendee-dropdown" data-eventtype="${eventType}">
            ${dropdown(id, dropdownItems)}
            <span class="attendee-dropdown-label">Attendees</span>
        </div>
        <div class="attendee-promotext">${attendeeText}</div>
    </div>
    <div class="price-wrapper">
        ${eventType === 'webinar' ? monthlyPriceDom : ''}
        <div class="price-annual ${id}__hide">${price(id, priceAnnual)}</div>
        <div class="price-annual-loader ">${loader(id)}</div>
    </div>
    <div class="card-action">
        <a
        type="button"
        role="link"
        href="${btnUrl}"
        class="${btnClass}"><span class="zm-button__slot">${btnText}</span>
        </a>
    </div>
    <div class="${id}__featurelist">
        <div class="feature-headline">${featureHeadline}</div>
        <ul>
        ${features.map((item) => `<li>${tick}<span>${item}</span></li>`).join('\n')}
        </ul>
    </div>
    <div class="card-footer">
        *Zoom One licenses required
    </div>
    </div>`;

    return htmlStr;
  };

  const eventCards = (id, eventsData) => {
    const { badge } = eventsData[0];
    const htmlStr = `  
      <div class="${id}__eventcards" data-badge="${badge}">
        <div class="badge-text">${badge}</div>
        <div class="content">
            ${eventsData.map((eventData) => eventCard(id, eventData)).join('\n')}
        </div>
      </div>`;

    return htmlStr;
  };

  const eventFeatureData = {
    webiner: [
      {
        title: 'Webinars',
        subtitle: 'Effortlessly broadcast messages with a user-friendly webinar platform',
        attendeeText: 'Host unlimited webinars at the chosen capacity',
        featureHeadline: '',
        features: [
          'Engage audience with high-quality video webcasting',
          'Boost engagement with Q&A, polling, and reactionvvs',
          'Improve webinar strategy with post-event reporting',
          'Support up to 100,000 attendees and 100 panelists'
        ],
        badge: 'WEBINARS',
        eventType: 'webinar'
      }
    ],
    events: [
      {
        title: 'Sessions',
        subtitle: 'Elevate event sessions with premium production features to drive engagement',
        attendeeText: 'Host unlimited webinars or events at the chosen capacity',
        featureHeadline: 'Includes Zoom Webinars, plus:',
        features: [
          'Customize event landing pages for effective branding',
          'Promote events with branded emails',
          'Measure performance with an interactive dashboard',
          'Seamless collaboration with co-hosts and co-editors',
          'Professional events tools: Simulive, Backstage, and more'
        ],
        badge: 'EVENTS PLATFORM',
        eventType: 'sessions'
      },
      {
        title: 'Events',
        subtitle: 'Host hybrid and virtual events in an all-in-one event management platform',
        attendeeText: 'Host unlimited webinars or events at the chosen capacity',
        featureHeadline: 'Everything in Sessions, plus:',
        features: [
          'Boost audience engagement with multi-session events',
          'Easily host events with tailored ticketing and mobile app',
          'Increase event revenue with Expo Floor and Sponsor area',
          'Foster attendee networking with customizable profiles ',
          'Extend reach with on-demand viewing in Event Lobby',
          'Accelerate event setup with curated event templates '
        ],
        badge: 'EVENTS PLATFORM',
        eventType: 'events'
      }
    ]
  };

  const { ID: ID$3 } = shared;
  const renderCards = async () => {
    //render webinard card
    const removeCardDom = () => {
      const cardsWrapper = document.querySelector(`.${ID$3}__cards-wrapper`);
      cardsWrapper?.remove();
    };
    const attachPoint = document.querySelector('.webinar-card-row');
    const cardsWrapper = document.createElement('div');
    const { webiner, events } = eventFeatureData;
    const RENDER_DELAY = 1000;

    removeCardDom();
    cardsWrapper.classList.add(`${ID$3}__cards-wrapper`);
    attachPoint.classList.add(`${ID$3}__hide`);
    attachPoint.insertAdjacentElement('beforebegin', cardsWrapper);

    await waitFor(RENDER_DELAY);
    const payPlan = getPaymentPlan();
    //render twin card

    cardsWrapper.insertAdjacentHTML('beforeend', eventCards(ID$3, events));

    if (payPlan === 'payperattendee') {
      return;
    }
    cardsWrapper.insertAdjacentHTML('afterbegin', eventCards(ID$3, webiner));
    //get monthly price
    const monthPrice = await getMonthlyPrice();
    console.log('🚀 monthPrice:', monthPrice);
    const monthlyPriceElem = document.querySelector('.price-monthly.webinar');
    monthlyPriceElem.innerHTML = '';
    monthlyPriceElem.insertAdjacentHTML('afterbegin', price(ID$3, monthPrice, 'month'));
  };

  const toggleSwitch = (id) => {
    const htmlStr = `
    <div class="${id}__togglecontainer">
        <div class="toggle-option-attendee">Pay Per Attendees</div>
        <div class="${id}__toggleswitch">
            <label class="switch"><input type="checkbox" checked="checked"/>
            <div class="toggle-helper"></div>
            </label>
        </div>
        <div class="toggle-option-subscription">Subscription</div>
    </div>`;
    return htmlStr;
  };

  const header = (id) => {
    const htmlStr = `
    <div class="${id}__header">
        ${toggleSwitch(id)}
        <span class="modal-opener">How are they different?</span>
    </div>`;
    return htmlStr;
  };

  const { ID: ID$2 } = shared;
  const revealAnnualPrice = async () => {
    const sessionEvPriceElem = document.querySelector(
      `.${ID$2}__eventcard[data-eventtype="sessions"] .dp-items>div`
    );
    const eventEvPriceElem = document.querySelector(
      `.${ID$2}__eventcard[data-eventtype="events"] .dp-items>div`
    );

    sessionEvPriceElem.click();
    await waitFor(1000);
    eventEvPriceElem.click();
    await waitFor(1000);
    pollerLite([() => document.querySelectorAll('.price-annual').length > 1], () => {
      document.querySelectorAll('.price-annual').forEach((elem) => {
        elem.classList.remove(`${ID$2}__hide`);
        elem.nextElementSibling.classList.add(`${ID$2}__hide`);
      });
    });
  };

  const toggleHandler = async (e) => {
    const { target } = e;
    const isChecked = target.checked;

    if (isChecked) {
      document.getElementById('zm-radio-group0-radio-1').click();
      changeAttendeCount();
    } else {
      document.getElementById('zm-radio-group0-radio-0').click();
    }
    await renderCards();

    revealAnnualPrice();
  };

  const { ID: ID$1 } = shared;

  const renderToggleSwitch = () => {
    //render a toggle switch
    const attendeeSelect = document.querySelector('.attendees-container');
    const attachPoint = document.querySelector('.select-container_left');
    attachPoint.classList.add(`${ID$1}__hide`);
    attendeeSelect.classList.add(`${ID$1}__hide`);
    //set initial attende to 500
    changeAttendeCount();

    if (document.querySelector(`.${ID$1}__togglecontainer`)) return;
    attachPoint.insertAdjacentHTML('beforebegin', header(ID$1));

    const toggleBtn = document.querySelector(`.${ID$1}__header`);
    toggleBtn.addEventListener('change', toggleHandler);
  };

  const comparisonModal = (id, modalData) => {
    const tableHeaderMsg1 =
      'A <b>subscription</b> allows you to host an unlimited amount of events at your chosen capacity.';
    const tableHeaderMsg2 =
      'The <b>pay per attendee</b> license determine how many total attendees can attend all of your account’s events held within a 12-month period from purchase.';

    const renderMessage = (input) => {
      const iconConfig = {
        true: zoomTick,
        false: dash
      };
      return input === 'true' || input === 'false' ? iconConfig[input] : input;
    };

    const renderTooltip = (text) => {
      return `<span class="${id}__tooltip">
      ${text && tooltip}<span>${text}</span>
    </span>`;
    };

    const comparisonRow = (data) => {
      const { feature, tooltipText, subscription, payPerAttendee } = data;
      const rowHtml = `<div class="comparison-row">
        <div class="comparison-row__col1" data-tooltip="${tooltipText}">
            <span>${feature}</span>
            <span class="${id}__tooltip">
                ${tooltipText && tooltip}<span>${tooltipText}</span>
            </span>
        </div>
        <div class="comparison-row__col2">${renderMessage(subscription)}</div>
        <div class="comparison-row__col3">${renderMessage(payPerAttendee)}</div>
    </div>`;
      return rowHtml;
    };

    const htmlStr = `
    <div class="${id}__modal ${id}__hide">
        <div class="${id}__comparisontable">
        <div class="${id}__comparisontable-close">${close}</div>
        <div class="${id}__comparisontable-title">How are they different?</div>
        <div class="${id}__comparisontable-header comparison-row">
            <div class="${id}__comparisontable-header-col1">*All plans require a <br /> Zoom One license</div>
            <div class="${id}__comparisontable-header-col2"><span>Subscription</span>&nbsp;${renderTooltip(
    tableHeaderMsg1
  )}</div>
            <div class="${id}__comparisontable-header-col3"><span>Pay Per Attendee</span>&nbsp;${renderTooltip(
    tableHeaderMsg2
  )}</div>
        </div>
        <div class="${id}__comparisontable-body">
            ${modalData.map((item) => comparisonRow(item)).join('\n')}
        </div>
        </div>
    </div>`;

    return htmlStr;
  };

  const modalData = [
    {
      feature: 'Webinar Setup in Web Portal',
      tooltipText: '',
      subscription: 'true',
      payPerAttendee: 'false'
    },
    {
      feature: 'Concurrent Events',
      tooltipText:
        'A subscription plan supports one live event at a time, while the pay per attendee plan allows concurrent live events.',
      subscription: 'false',
      payPerAttendee: 'true'
    },
    {
      feature: 'Overages',
      tooltipText: '',
      subscription: 'false',
      payPerAttendee: 'true'
    },
    {
      feature: 'Events Platform Hubs',
      tooltipText:
        'Zoom Events hubs offer convenient event organization, allowing hosts to group related events based on specific topics.',
      subscription: '1 hub per license',
      payPerAttendee: '1000 hubs'
    },
    {
      feature: 'Events Platform Hosts <br/>(500 attendees or more)',
      tooltipText:
        'Zoom Events hub hosts can create, edit, and publish events that have been created by the hub owner.',
      subscription: '5 hub hosts',
      payPerAttendee: '100 hub hosts'
    },
    {
      feature: 'Events Platform Hosts <br /> (100 attendees)',
      tooltipText:
        'Zoom Events hub hosts can create, edit, and publish events that have been created by the hub owner.',
      subscription: '2 hub hosts',
      payPerAttendee: '100 hub hosts'
    }
  ];

  const modalHandler = (target) => {
    const { ID } = shared;

    const modal = document.querySelector(`.${ID}__modal`);
    if (target.closest('.modal-opener')) {
      modal.classList.remove(`${ID}__hide`);
    } else if (
      target.closest(`.${ID}__comparisontable-close`) ||
      (target.closest(`.${ID}__modal`) && !target.closest(`.${ID}__comparisontable`))
    ) {
      modal.classList.add(`${ID}__hide`);
    }
  };

  const { ID, VARIATION } = shared;

  const init = async () => {
    renderToggleSwitch();

    document.body.insertAdjacentHTML('afterbegin', comparisonModal(ID, modalData));

    await renderCards();
    revealAnnualPrice();
  };

  var activate = () => {
    setup(); //use if needed

    document.body.addEventListener('click', (e) => {
      const { target } = e;

      dropdownToggleHandler(target);
      modalHandler(target);
    });

    //Event listener for the custom event
    document.addEventListener('attendee-update', attendeeUpdateHandler);

    //-----------------------------
    //If control, bail out from here
    //-----------------------------
    if (VARIATION === 'control') {
      return;
    }

    init();
  };

  if (window.location.pathname === '/pricing/events') {
    pollerLite(['#new-pricing-content'], activate);
  }

})();
