if (!customElements.get('quick-add-modal')) {
  customElements.define(
    'quick-add-modal',
    class QuickAddModal extends ModalDialog {
      constructor() {
        super();
        this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');
      }

      hide(preventFocus = false) {
        const cartNotification = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        if (cartNotification) cartNotification.setActiveElement(this.openedBy);
        this.modalContent.innerHTML = '';

        if (preventFocus) this.openedBy = null;
        super.hide();
      }
      swatches(productElementPar, responseHTML) {
        var all_colors = JSON.parse(responseHTML.querySelector('[data-all_color-swatches]').innerText.trim().replaceAll(/\s+"|"\s+/gm, '"').replaceAll(/\}\s+/gm,'}'));
        console.log(all_colors, productElementPar, productElementPar.querySelectorAll('[name="Color"], [name="Colour"]'));
        productElementPar.querySelectorAll('[name="Color"], [name="Colour"]')
        .forEach(function (e) {
          
          if (all_colors.hasOwnProperty(e.value)) {
            // let elt = e.parentNode?.querySelector("label");
                  let elt = e.nextElementSibling;
            elt.innerText = "";
            // elt.style.backgroundColor = all_colors[e.value];
  
            if(all_colors[e.value].color == "rgba(0,0,0,0)" || all_colors[e.value].color == "") {
              elt.style.backgroundImage=`url('${all_colors[e.value].image}')`;
            } else {
              elt.style.backgroundColor=all_colors[e.value].color;
            }
  
            // elt.style.width = "30px";
            // elt.style.height = "48px";
            // elt.style.border = "4px solid #ddd";
          }
          setTimeout(() => {
            console.log('auick-add.js swatches method', e.attributes.id.value);
            document.querySelector("#"+e.attributes.id.value).addEventListener('change', function(el) {
              console.log('sdasd', e);
              document.querySelectorAll('.product__media-list .product__media.media img').forEach(function(elt) {
                  if(elt.getAttribute('alt') == e.value || elt.getAttribute('alt') == "") {
                    elt.closest('li').style.display = "";
                  } else {
                    elt.closest('li').style.display = "none";
                  }
              });
              //debugger;
            });
          }, 500);
        });
          return productElementPar;
      }
      show(opener) {
        opener.setAttribute('aria-disabled', true);
        opener.classList.add('loading');
        // opener.querySelector('.loading__spinner').classList.remove('hidden');

        fetch(opener.getAttribute('data-product-url'))
          .then((response) => response.text())
          .then((responseText) => {
            const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
            this.productElement = responseHTML.querySelector('section[id^="MainProduct-"]');
            this.productElement.classList.forEach((classApplied) => {
              if (classApplied.startsWith('color-') || classApplied === 'gradient')
                this.modalContent.classList.add(classApplied);
            });
            this.preventDuplicatedIDs();
            this.removeDOMElements();
            let productElementPar = this.swatches(this.productElement, responseHTML);
            this.setInnerHTML(this.modalContent, productElementPar.innerHTML);
            // this.setInnerHTML(this.modalContent, this.productElement.innerHTML);

            if (window.Shopify && Shopify.PaymentButton) {
              Shopify.PaymentButton.init();
            }

            if (window.ProductModel) window.ProductModel.loadShopifyXR();

            this.removeGalleryListSemantic();
            this.updateImageSizes();
            this.preventVariantURLSwitching();
            super.show(opener);
          })
          .finally(() => {
            opener.removeAttribute('aria-disabled');
            opener.classList.remove('loading');
            opener.querySelector('.loading__spinner')?.classList.add('hidden');
          });
      }

      setInnerHTML(element, html) {
        element.innerHTML = html;

        // Reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
        element.querySelectorAll('script').forEach((oldScriptTag) => {
          const newScriptTag = document.createElement('script');
          Array.from(oldScriptTag.attributes).forEach((attribute) => {
            newScriptTag.setAttribute(attribute.name, attribute.value);
          });
          newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
          oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
        });
      }

      preventVariantURLSwitching() {
        const variantPicker = this.modalContent.querySelector('variant-radios,variant-selects');
        if (!variantPicker) return;

        variantPicker.setAttribute('data-update-url', 'false');
      }

      removeDOMElements() {
        const pickupAvailability = this.productElement.querySelector('pickup-availability');
        if (pickupAvailability) pickupAvailability.remove();

        const productModal = this.productElement.querySelector('product-modal');
        if (productModal) productModal.remove();

        const modalDialog = this.productElement.querySelectorAll('modal-dialog');
        if (modalDialog) modalDialog.forEach((modal) => modal.remove());
      }

      preventDuplicatedIDs() {
        const sectionId = this.productElement.dataset.section;
        this.productElement.innerHTML = this.productElement.innerHTML.replaceAll(sectionId, `quickadd-${sectionId}`);
        this.productElement.querySelectorAll('variant-selects, variant-radios, product-info').forEach((element) => {
          element.dataset.originalSection = sectionId;
        });
      }

      removeGalleryListSemantic() {
        const galleryList = this.modalContent.querySelector('[id^="Slider-Gallery"]');
        if (!galleryList) return;

        galleryList.setAttribute('role', 'presentation');
        galleryList.querySelectorAll('[id^="Slide-"]').forEach((li) => li.setAttribute('role', 'presentation'));
      }

      updateImageSizes() {
        const product = this.modalContent.querySelector('.product');
        const desktopColumns = product.classList.contains('product--columns');
        if (!desktopColumns) return;

        const mediaImages = product.querySelectorAll('.product__media img');
        if (!mediaImages.length) return;

        let mediaImageSizes =
          '(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)';

        if (product.classList.contains('product--medium')) {
          mediaImageSizes = mediaImageSizes.replace('715px', '605px');
        } else if (product.classList.contains('product--small')) {
          mediaImageSizes = mediaImageSizes.replace('715px', '495px');
        }

        mediaImages.forEach((img) => img.setAttribute('sizes', mediaImageSizes));
      }
    }
  );
}
