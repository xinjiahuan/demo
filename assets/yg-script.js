document.addEventListener('DOMContentLoaded', function () {
  class MyElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
      this.render();
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 10px;
            background-color: #f0f0f0;
            border: 1px solid #ddd;
          }
        </style>
        <div>
          <h2>My Custom Element</h2>
        </div>
      `;
    }
  }

  if (!window.customElements.get('my-element')) {
    customElements.define('my-element', MyElement);
  }

  // 创建 IntersectionObserver 实例
  window.YGImageLoader = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const newImg = new Image();
        newImg.onload = () => {
          img.src = newImg.src;
          img.removeAttribute('data-src');  // 如果只需要加载一次
          img.removeAttribute('srcset');
          observer.unobserve(img);          // 停止观察该元素
        }
        newImg.src = img.getAttribute('data-src');
      }
    });
  }, {
    rootMargin: "50px", // 预加载距离视口 50px 的图片
  });

  class YGImage extends HTMLElement {
    constructor() {
      super()
      this.init()
    }

    get images() {
      return this.querySelectorAll('img[data-src]')
    }

    init() {
      // 这里放置初始化逻辑
      this.loaderImg()
    }

    loaderImg() {
      // 这里放置自定义逻辑
      this.images.forEach((img) => {
        window.YGImageLoader.observe(img)
      })
    }
  }

  if (!window.customElements.get('yg-image')) {
    window.customElements.define('yg-image', YGImage)
  }

  class DynamicItem extends HTMLElement {
    constructor() {
      super();
      this.observer = null;
    }

    connectedCallback() {
      this.classList.add("fade-in-on-scroll");

      const options = {
        threshold: 0.3
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.classList.add("yg-animated");
            this.observer.unobserve(this);
          }
        });
      }, options);

      this.observer.observe(this);
    }

    disconnectedCallback() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }
  }

  if (!customElements.get("yg-animation-item")) {
    customElements.define("yg-animation-item", DynamicItem);
  }

  class YGAnimationImage extends HTMLElement {
    connectedCallback() {
      const images = document.querySelectorAll('.yg-featured-image');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      }, { threshold: 0.1 });

      images.forEach((img) => observer.observe(img));
    }
  }

  if (!customElements.get('yg-animation-image')) {
    customElements.define('yg-animation-image', YGAnimationImage);
  }

  class YGNumberOdometer extends HTMLElement {
    connectedCallback() {
      // 不用 trim，保留原始内容，包括空格
      const number = this.textContent;
      const duration = parseInt(this.getAttribute('data-duration')) || 1500;
      const digitHeight = parseFloat(this.getAttribute('data-digit-height')) || 1.5; // 默认1.5em
      this.textContent = '';
      this.style.visibility = 'hidden';

      const wrapper = document.createElement('div');
      wrapper.classList.add('yg-number-odometer');

      const circleCount = 4;

      [...number].forEach((char) => {
        const container = document.createElement('div');
        container.classList.add('digit-wrapper');

        const digits = document.createElement('div');
        digits.classList.add('digit');

        // 如果是空格，仍然创建 digit-wrapper，但 digits 内不放数字列表
        if (char === ' ') {
          // 可以留空，或者添加一个空白字符保证宽度
          digits.textContent = '\u00A0'; // 不换行空格
        } else if (isNaN(char)) {
          // 非数字字符（比如符号）显示原字符
          const symbol = document.createElement('div');
          symbol.textContent = char;
          digits.appendChild(symbol);
        } else {
          // 数字字符，创建滚动数字列表
          for (let c = 0; c < circleCount; c++) {
            for (let i = 0; i <= 9; i++) {
              const num = document.createElement('div');
              num.textContent = i;
              digits.appendChild(num);
            }
          }
        }

        container.appendChild(digits);
        wrapper.appendChild(container);
      });

      this.appendChild(wrapper);

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(
            (entries, observer) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  observer.disconnect();
                  this.animate(number, duration, circleCount, digitHeight);
                }
              });
            },
            { threshold: 0.5 }
        ).observe(this);
      }
    }

    animate(number, duration, circleCount, digitHeight) {
      this.style.visibility = 'visible';
      const digitWrappers = this.querySelectorAll('.digit');
      const singleHeightEm = digitHeight;

      [...number].forEach((char, i) => {
        if (char === ' ') {
          // 空格不需要动画，直接跳过
          return;
        }

        if (isNaN(char)) {
          digitWrappers[i].style.transform = 'translateY(0)';
          return;
        }

        const value = parseInt(char);
        const totalDigits = 10;

        const randomSpin = Math.floor(Math.random() * (circleCount - 2)) + 2;
        const finalOffset = (randomSpin * totalDigits + value) * -singleHeightEm;

        setTimeout(() => {
          digitWrappers[i].style.transition =
              `transform ${duration / 1000}s cubic-bezier(0.3, 1.3, 0.3, 1)`;
          digitWrappers[i].style.transform = `translateY(${finalOffset}em)`;
        }, i * 120 + Math.random() * 100);
      });
    }
  }

  if (!customElements.get('yg-number-odometer')) {
    customElements.define('yg-number-odometer', YGNumberOdometer);
  }


  class YGPopupBox extends HTMLElement {
    constructor() {
      super();
      this.clickClosePopup = this.clickClosePopup.bind(this);
      this.clickOpenPopup = this.clickOpenPopup.bind(this);
      this.$contentInner = null;
    }

    connectedCallback() {
      this.$contentInner = this.querySelector('.yg-popup-box-content-inner');
      this.addEventListener('click', this.clickClosePopup)
      document.addEventListener("YGPopup:open", this.clickOpenPopup)
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.handleClick);
      document.removeEventListener('YGPopupBox:open', this.handleOpenEvent);
    }

    clickOpenPopup(event) {
      const {$popupTemplate, fn} = event.detail;
      this.openPopup($popupTemplate, fn);
    }

    clickClosePopup(e) {
      this.closePopup(e, () => {
      });
    }

    openPopup($popupTemplate, fn) {
      // popupTemplate：需要替换的元素
      if (!$popupTemplate || !this.$contentInner) return;
      this.$contentInner.innerHTML = $popupTemplate.innerHTML;
      document.body.style.overflow = 'hidden';
      this.style.display = 'flex';
      typeof fn === 'function' && fn();
    }

    closePopup(e, fn) {
      let closeClassName = ["yg-popup-box-close", "yg-popup-box"]
      if (closeClassName.some(className => e.target.classList.contains(className))) {
        this.style.display = 'none';
        this.$contentInner.innerHTML = '';
        document.body.style.overflow = 'auto';
        typeof fn === 'function' && fn();
      }
    }
  }

  if (!window.customElements.get('yg-popup-box')) {
    window.customElements.define('yg-popup-box', YGPopupBox);
  }

  class YGOpenPopup extends HTMLElement {
    constructor() {
      super();
      this.itemClick = this.itemClick.bind(this);
    }

    connectedCallback() {
      this.addEventListener('click', this.itemClick);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.itemClick);
    }

    itemClick() {
      let $popupTemplate = this.querySelector('template') || this.querySelector('.yg-popup-template');

      console.log("$popupTemplate: ", $popupTemplate)
      if ($popupTemplate) {
        document.dispatchEvent(new CustomEvent("YGPopup:open", {
          bubbles: true,
          detail: {
            $popupTemplate,
            fn: () => {
            }
          }
        }))
      }
    }
  }

  if (!window.customElements.get('yg-open-popup')) {
    window.customElements.define('yg-open-popup', YGOpenPopup);
  }

  class YGSlide extends HTMLElement {
    constructor() {
      super()
    }

    connectedCallback() {
      this.initSwiper()
    }

    initSwiper() {
      new Swiper(this, {
        pagination: {
          el: '.yg-slide-pagination',
          // 数字指示器
          // type: 'fraction',
          clickable: true,
        },
        navigation: {
          nextEl: this.querySelector('.yg-slide-next'),
          prevEl: this.querySelector('.yg-slide-prev'),
        },
        breakpoints: {
          220: {
            slidesPerView: 1.4,
            spaceBetween: 16,
          },
          700: {
            slidesPerView: 2,
            spaceBetween: 16,
          },
          1150: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
        }
      })
    }
  }

  if (!window.customElements.get('yg-slide')) {
    window.customElements.define('yg-slide', YGSlide)
  }

  class MouseCursor extends HTMLElement {
    constructor() {
      super();

      this.targetX = 0;
      this.targetY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.lerpFactor = 0.15;

      this.animate = this.animate.bind(this);
      this.handleMouseMove = this.handleMouseMove.bind(this);
      this.handleMouseLeave = this.handleMouseLeave.bind(this);
      this.handleClick = this.handleClick.bind(this);
    }

    connectedCallback() {
      this.container = this.closest('.footer__block--cursor');
      if (!this.container) return;

      this.style.opacity = '0';

      this.container.addEventListener('mousemove', this.handleMouseMove);
      this.container.addEventListener('mouseleave', this.handleMouseLeave);
      this.container.addEventListener('click', this.handleClick);

      requestAnimationFrame(this.animate);
    }

    disconnectedCallback() {
      if (!this.container) return;

      this.container.removeEventListener('mousemove', this.handleMouseMove);
      this.container.removeEventListener('mouseleave', this.handleMouseLeave);
      this.container.removeEventListener('click', this.handleClick);
    }

    handleMouseMove(e) {
      const rect = this.container.getBoundingClientRect();
      this.targetX = e.clientX - rect.left - this.offsetWidth / 2;
      this.targetY = e.clientY - rect.top - this.offsetHeight / 2;

      // 检查是否在 button 上 或 button 内部元素上
      const isOverButton = e.target.closest('.button');

      if (isOverButton) {
        this.style.opacity = '0';
      } else {
        this.style.opacity = '1';
      }
    }

    handleMouseLeave() {
      this.style.opacity = '0';
    }

    handleClick(e) {
      const isOverButton = e.target.closest('.button');
      if (isOverButton) return;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 400);

      // 延迟跳转
      const link = this.querySelector('a');
      if (link) {
        const url = link.getAttribute('href');
        const target = link.getAttribute('target');

        if (url) {
          setTimeout(() => {
            if (target === '_blank') {
              window.open(url, '_blank');
            } else {
              window.location.href = url;
            }
          }, 150);
        }
      }
    }

    animate() {
      this.currentX += (this.targetX - this.currentX) * this.lerpFactor;
      this.currentY += (this.targetY - this.currentY) * this.lerpFactor;

      this.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;

      requestAnimationFrame(this.animate);
    }
  }

  if (!customElements.get('mouse-cursor')) {
    customElements.define('mouse-cursor', MouseCursor);
  }

  class ScrollingImages extends HTMLElement {
    constructor() {
      super();

      this.addEventListener('mouseover', this._pauseScrolling.bind(this));
      this.addEventListener('mouseout', this._resumeScrolling.bind(this));

      this.resizeObserver = new ResizeObserver((entries) => {
        this._calculateDuration(entries);
        this._duplicateIfNeeded();
      });
    }

    connectedCallback() {
      this.resizeObserver.observe(this);
    }

    disconnectedCallback() {
      this.resizeObserver.disconnect();
    }

    _calculateDuration(entries) {
      const scrollingSpeed = parseInt(this.getAttribute('scrolling-speed') || 20),
        contentWidth = entries[0].contentRect.width,
        slowFactor = 1 + (Math.min(15000, contentWidth) - 375) / (1200 - 375);

      const contentDiv = this.querySelector('img');
      if (contentDiv) {
        this.style.setProperty(
          '--marquee-animation-duration',
          `${((scrollingSpeed * slowFactor * contentDiv.clientWidth) / contentWidth).toFixed(3)}s`
        );
      }
    }

    _pauseScrolling() {
      this.parentNode.querySelectorAll('scrolling-image').forEach((item) => {
        item.style.animationPlayState = 'paused';
      });
    }

    _resumeScrolling() {
      this.parentNode.querySelectorAll('scrolling-image').forEach((item) => {
        item.style.animationPlayState = 'running';
      });
    }

    _duplicateIfNeeded() {
      const container = this;
      const images = container.querySelectorAll('yg-image');
      let totalWidth = 0;

      images.forEach((img) => {
        totalWidth += img.clientWidth;
      });

      if (totalWidth < container.clientWidth) {
        const cloneNeeded = images.length < 6;
        if (cloneNeeded) {
          images.forEach((img) => {
            const clone = img.cloneNode(true);
            container.appendChild(clone);
          });
        }
      }
    }
  }

  if (!window.customElements.get('scrolling-image')) {
    window.customElements.define('scrolling-image', ScrollingImages);
  }

  class TabGroup extends HTMLElement {
    constructor() {
      super();
      this.handleClick = this.handleClick.bind(this);
    }

    connectedCallback() {
      this.addEventListener('click', this.handleClick);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.handleClick);
    }

    handleClick(event) {
      const tabItem = event.target.closest('tab-item');
      if (!tabItem) return;

      const isOpen = tabItem.hasAttribute('open');

      this.querySelectorAll('tab-item[open]').forEach((item) => {
        item.removeAttribute('open');
      });

      if (!isOpen) {
        tabItem.setAttribute('open', '');
      }
    }
  }

  if (!customElements.get('tab-group')) {
    customElements.define('tab-group', TabGroup);
  }

  class YGSwiper extends HTMLElement {
    constructor() {
        super()
    }
    connectedCallback() {
      this.getAllAttributes()
      this.initSwiper()
    }

    get getCurrentSlidesPerView() {
      if (!this['breakpoints']) return 1;

      const screenWidth = window.innerWidth;

      // 将breakpoints按数值从小到大排序
      const sortedKeys = Object.keys(this['breakpoints']).map(Number).sort((a, b) => a - b);

      let current = sortedKeys[0]; // 默认取最小的

      // 遍历找到小于等于当前屏幕宽度的最大key
      for (let i = 0; i < sortedKeys.length; i++) {
        if (screenWidth >= sortedKeys[i]) {
          current = sortedKeys[i];
        } else {
          break;
        }
      }
    
      return this['breakpoints'][current].slidesPerView;
    }

    getAllAttributes() {
      let booleanAttrs = ['loop', 'pagination', 'navigation', 'centered-slides'];
      let jsonAttrs = ['breakpoints']
      for (const attr of this.attributes) {
        if (attr.name.startsWith('data-')) {
          const cleanName = attr.name.slice(5); // 去除 'data-' 前缀
          
          let value = attr.value;
          if (booleanAttrs.includes(cleanName)) {
            value = value === 'true';
          } else if (jsonAttrs.includes(cleanName)) {
            value = this.parseSwiperBreakpoints(value);
          }

          this[cleanName] = value;
        }
      }
    }

    parseSwiperBreakpoints(str) {
      const result = {};
      const pairs = str.split(',');

      for (const pair of pairs) {
        const [breakpoint, values] = pair.split(':');
        if (!breakpoint || !values) continue;
    
        const [slides, space] = values.split('-').map(Number);
    
        result[breakpoint.trim()] = {
          slidesPerView: slides,
          spaceBetween: space
        };
      }

      return result;
    }

    initSwiper() {
      const swiper = new Swiper(this, {
        // 这里放置 swiper 的配置
        initialSlide: this['initial-slide']?this['initial-slide']:0,
        effect: this['effect'],
        loop: this['loop'],
        centeredSlides: this['centered-slides'],
        autoplay: this['autoplay']?{
          delay: this['autoplay'],
          stopOnLastSlide: false,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }:false,
        pagination: this['pagination']?{
          el: '.swiper-pagination',
          clickable: true,
        }:false,
        navigation: this['navigation']?{
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        }:false,
        breakpoints: this['breakpoints']?this['breakpoints']:false,
        on: {
          init: e => {
            if (e.passedParams.loop) {
              let num = this.getCurrentSlidesPerView;
              let sliderLength = e.slides.length;

              if (this['centered-slides']) {
                num += 2;
              }

              if(sliderLength <= num){
                for (let index = 1; index < Math.ceil(num / sliderLength); index++) {
                  e.slides.forEach((slide) => {
                    const clonedElement = slide.cloneNode(true);
                    e.slidesEl.appendChild(clonedElement);
                  })
                }

                setTimeout(() => {
                  let $bullets = this.querySelectorAll('.swiper-pagination-bullet');
                  $bullets.forEach((bullet, index) => {
                    if (index >= sliderLength) {
                      bullet.style.display = 'none';
                    }
                  })
                }, 250)
              }
            }
          }
        }
      })
    }
  }
  if (!window.customElements.get('yg-swiper')) {
      window.customElements.define('yg-swiper', YGSwiper)
  }
  class YGAccordion extends HTMLElement {
      constructor() {
          super()
          this.progressBar = this.querySelector('.yg-accordion-bar')
          this.currentBar = this.progressBar.querySelector('.yg-current-bar')
          this.itemList = this.querySelectorAll('.yg-row')
          this.prevActiveItem = null
          this.progressBarHeight = this.progressBar.clientHeight
          this.progress = 0
          this.speed = 0.2
      }

      connectedCallback() {
        this.itemList.forEach((item) => {
          item.addEventListener('click', () => {
            this.animateProgress(item)
          });
        })

        this.updateAccordionTop()

        requestAnimationFrame(this.animateProgress.bind(this))
      }
      
      animateProgress(item) {
        if (item instanceof Element || item instanceof HTMLDocument) {
          this.progress = item.getAttribute('data-top') / 1
          return
        } else {
          this.progress += this.speed; 
        }
        this.currentBar.style.height = `${this.progress}px`;

        let currentItem = this.prevActiveItem;
        this.itemList.forEach((item) => {
          if (item.getAttribute('data-top') <= this.progress) {
            currentItem = item;
          }
        })
        
        this.activeItem(currentItem)

        if (this.progress < this.progressBarHeight) {
          requestAnimationFrame(this.animateProgress.bind(this))
        } else {
          this.progress = 0;
          requestAnimationFrame(this.animateProgress.bind(this))
        }
      }

      updateAccordionTop() {
        this.itemList.forEach((item) => {
          item.setAttribute('data-top', item.offsetTop)
        })
      }

      activeItem(item) {
          if (!item || this.prevActiveItem === item) return
          if(this.prevActiveItem) {
            this.prevActiveItem.classList.remove('active')
          };

          item.classList.add('active')
          this.prevActiveItem = item;
          
          this.progressBarHeight = this.progressBar.clientHeight
      }
  }
  if (!window.customElements.get('yg-accordion')) {
      window.customElements.define('yg-accordion', YGAccordion)
  }

  class YGMap extends HTMLElement {
      constructor() {
          super()
          this.first = true
          this.dotList = this.querySelectorAll('.yg-dot')
          this.buttonList = this.querySelectorAll('.yg-map-button')
          this.itemClick = this.itemClick.bind(this);
          this.mapPaths = this.querySelectorAll('.yg-map-path')
      }
      connectedCallback() {
        this.buttonList.forEach((button) => {
          button.addEventListener('click', (e) => this.itemClick(e));
        })

        this.itemClick()
      }

      itemClick(e) {
          let $button = this.first? this.buttonList[0]: e.target.closest('.yg-map-button');
          let classItem = $button.getAttribute('data-class');
          let target  = this.querySelector(`.${classItem}`);
          
          this.mapPaths.forEach((path) => {
            path.classList.remove('active');
          })

          this.buttonList.forEach((button) => {
            button.classList.remove('active');
          })

          $button.classList.add('active');
          target.classList.add('active');

          if ($button.getAttribute('data-index')) {
            this.dotList.forEach((dot) => {
              if (dot.getAttribute('data-index') == $button.getAttribute('data-index')) {
                dot.classList.add('active');
              } else {
                dot.classList.remove('active');
              }
            })
          }

          const container = this.querySelector('.yg-map-container'); // 替换为你的容器选择器

          if (target && container) {
            const targetRect = target.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
          
            // 计算 target 相对 container 的 top、left 距离
            const offsetTop = targetRect.top - containerRect.top + container.scrollTop;
            const offsetLeft = targetRect.left - containerRect.left + container.scrollLeft;
          
            // 计算居中位置
            const scrollTop = offsetTop - (container.clientHeight / 2) + (targetRect.height / 2);
            const scrollLeft = offsetLeft - (container.clientWidth / 2) + (targetRect.width / 2);

            if (!this.first) {
              container.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
            
            container.scrollTo({
              top: scrollTop,
              left: scrollLeft,
              behavior: 'smooth'
            });
            
          }
          this.first = false
      }
  }
  if (!window.customElements.get('yg-map')) {
      window.customElements.define('yg-map', YGMap)
  }

  class YGFindProduct extends HTMLElement {
    constructor() {
      super();
      this.itemHover = this.itemHover.bind(this);
    }
  
    connectedCallback() {
      this.items = this.querySelectorAll('.yg-item');

      const firstItem = this.querySelector('.yg-item');
      if (firstItem) {
        const imageBox = firstItem.querySelector('.yg-image-box');
        if (imageBox) {
          const imageHeight = imageBox.offsetHeight;
          // 设置 CSS 变量 --image-height
          this.style.setProperty('--image-height', `${imageHeight}px`);
        }
      }
      
      this.items.forEach(item => {
        item.addEventListener('mouseenter', this.itemHover);
      });
    }
  
    disconnectedCallback() {
      this.items.forEach(item => {
        item.removeEventListener('mouseenter', this.itemHover);
      });
    }
  
    itemHover(e) {
      this.items.forEach(item => {
        item.classList.remove('active');
      });
      e.currentTarget.classList.add('active');
    }
  }
  
  if (!window.customElements.get('yg-find-product')) {
    window.customElements.define('yg-find-product', YGFindProduct);
  }
});