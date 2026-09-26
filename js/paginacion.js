(function ($) {
    if (typeof $ === 'undefined') {
        console.error("jQuery no está cargado. El plugin pageMe requiere jQuery.");
        return;
    }

    $.fn.pageMe = function (opts) {
        var $this = this,
            defaults = {
                perPage: 20,
                pagerSelector: "#resultadoPaginador",
                prevText: "&lt; Anterior",
                nextText: "Siguiente &gt;"
            },
            settings = $.extend(defaults, opts);

        return $this.each(function () {
            var listElement = $(this);
            var children = listElement.children("tr");
            var pager = $(settings.pagerSelector);
            
            if (!pager.length) {
                console.warn("pageMe: No se encontró el contenedor del paginador:", settings.pagerSelector);
                return;
            }

            pager.empty();
            
            var numItems = children.length;
            var numPages = Math.ceil(numItems / settings.perPage);
            
            // Si no hay filas o solo hay 1 página, mostrar todo y salir
            if (numPages <= 1) {
                children.show();
                return;
            }

            pager.data("curr", 0);

            // Generar opciones para el selector desplegable
            var optionsHtml = "";
            for (var i = 1; i <= numPages; i++) {
                optionsHtml += `<option value="${i - 1}">${i}</option>`;
            }

            // Estructura HTML idéntica a las capturas
            var paginadorHTML = `
                <div class="custom-pager-box">
                    <div class="pager-indicator" id="pagerIndicator">1/${numPages}</div>
                    <div class="pager-controls-row">
                        <button type="button" class="pager-btn-link prev_link">${settings.prevText}</button>
                        <div class="pager-select-wrapper">
                            <select class="browser-default pager-select" id="pagerSelectPage">
                                ${optionsHtml}
                            </select>
                        </div>
                        <button type="button" class="pager-btn-link next_link">${settings.nextText}</button>
                    </div>
                </div>
            `;

            pager.html(paginadorHTML);

            var $prevBtn = pager.find(".prev_link");
            var $nextBtn = pager.find(".next_link");
            var $selectPage = pager.find("#pagerSelectPage");
            var $indicator = pager.find("#pagerIndicator");

            // Mostrar solo los registros de la primera página
            children.hide();
            children.slice(0, settings.perPage).show();
            actualizarBotones(0);

            // Evento al cambiar página desde el selector desplegable
            $selectPage.on("change", function () {
                var selectedPage = parseInt($(this).val(), 10);
                goTo(selectedPage);
            });

            // Evento botón Anterior
            $prevBtn.on("click", function (e) {
                e.preventDefault();
                var curr = parseInt(pager.data("curr"), 10);
                if (curr > 0) goTo(curr - 1);
            });

            // Evento botón Siguiente
            $nextBtn.on("click", function (e) {
                e.preventDefault();
                var curr = parseInt(pager.data("curr"), 10);
                if (curr < numPages - 1) goTo(curr + 1);
            });

            function actualizarBotones(page) {
                // Deshabilitar botón anterior en la primera página
                if (page === 0) {
                    $prevBtn.addClass("disabled").prop("disabled", true);
                } else {
                    $prevBtn.removeClass("disabled").prop("disabled", false);
                }

                // Deshabilitar botón siguiente en la última página
                if (page >= numPages - 1) {
                    $nextBtn.addClass("disabled").prop("disabled", true);
                } else {
                    $nextBtn.removeClass("disabled").prop("disabled", false);
                }
            }

            function goTo(page) {
                var startAt = page * settings.perPage;
                var endOn = startAt + settings.perPage;

                children.hide().slice(startAt, endOn).show();
                pager.data("curr", page);

                // Actualizar valor en el select y el indicador visual
                $selectPage.val(page);$indicator.text((page + 1) + "/" + numPages);

                actualizarBotones(page);
            }
        });
    };
}(jQuery));

// (function ($) {
//     if (typeof $ === 'undefined') {
//         console.error("jQuery no está cargado. El plugin pageMe requiere jQuery.");
//         return;
//     }

//     // Definición del plugin
//     $.fn.pageMe = function (opts) {
//         var $this = this,
//             defaults = {
//                 perPage: 10,
//                 showPrevNext: true,
//                 hidePageNumbers: false,
//                 pagerSelector: ".pagination",
//                 activeClass: "active",
//                 prevText: "<i class='material-icons'>chevron_left</i>",
//                 nextText: "<i class='material-icons'>chevron_right</i>"
//             },
//             settings = $.extend(defaults, opts);

//         return $this.each(function () {
//             var listElement = $(this);
//             var children = listElement.children();
//             var pager = $(settings.pagerSelector);
            
//             if (!pager.length) {
//                 console.warn("pageMe: No se encontró el contenedor de paginación:", settings.pagerSelector);
//                 return;
//             }

//             // Limpiar el paginador existente
//             pager.empty();
            
//             var numItems = children.length;
//             var numPages = Math.ceil(numItems / settings.perPage);
            
//             // Si hay 1 o menos páginas, mostrar todo y no pintar paginación
//             if (numPages <= 1) {
//                 children.show();
//                 return;
//             }

//             pager.data("curr", 0);
            
//             // Botón Anterior
//             if (settings.showPrevNext) {
//                 $('<li class="waves-effect"><a href="#!" class="prev_link">' + settings.prevText + '</a></li>').appendTo(pager);
//             }
            
//             // Números de Página
//             var curr = 0;
//             while (numPages > curr && !settings.hidePageNumbers) {
//                 var activeClass = (curr === 0) ? settings.activeClass : "waves-effect";
//                 $('<li class="' + activeClass + '"><a href="#!" class="page_link">' + (curr + 1) + '</a></li>').appendTo(pager);
//                 curr++;
//             }
            
//             // Botón Siguiente
//             if (settings.showPrevNext) {
//                 $('<li class="waves-effect"><a href="#!" class="next_link">' + settings.nextText + '</a></li>').appendTo(pager);
//             }
            
//             // Estado Inicial (Desactivar 'Anterior' en la página 1)
//             if (settings.showPrevNext) {
//                 pager.find('.prev_link').parent().addClass('disabled').removeClass('waves-effect');
//             }
            
//             children.hide();
//             children.slice(0, settings.perPage).show();
            
//             pager.find('li .page_link').click(function (e) {
//                 e.preventDefault();
//                 var clickedPage = parseInt($(this).text(), 10) - 1;
//                 goTo(clickedPage);
//             });
            
//             pager.find('li .prev_link').click(function (e) {
//                 e.preventDefault();
//                 prev();
//             });
            
//             pager.find('li .next_link').click(function (e) {
//                 e.preventDefault();
//                 next();
//             });
            
//             function prev() {
//                 var goToPage = parseInt(pager.data("curr")) - 1;
//                 if (goToPage >= 0) goTo(goToPage);
//             }
            
//             function next() {
//                 var goToPage = parseInt(pager.data("curr")) + 1;
//                 if (goToPage < numPages) goTo(goToPage);
//             }
            
//             function goTo(page) {
//                 var startAt = page * settings.perPage,
//                     endOn = startAt + settings.perPage;
                
//                 // Mostrar solo los elementos de la página actual
//                 children.css('display', 'none').slice(startAt, endOn).show();
                
//                 // Actualizar estado visual de "Anterior"
//                 if (page >= 1) {
//                     pager.find('.prev_link').parent().removeClass('disabled').addClass('waves-effect');
//                 } else {
//                     pager.find('.prev_link').parent().addClass('disabled').removeClass('waves-effect');
//                 }
                
//                 // Actualizar estado visual de "Siguiente"
//                 if (page < (numPages - 1)) {
//                     pager.find('.next_link').parent().removeClass('disabled').addClass('waves-effect');
//                 } else {
//                     pager.find('.next_link').parent().addClass('disabled').removeClass('waves-effect');
//                 }
                
//                 // Actualizar la clase "active" en el número de página actual
//                 pager.data("curr", page);
//                 pager.find('li').removeClass(settings.activeClass);
//                 pager.find('li:not(:first-child):not(:last-child)').addClass('waves-effect');
                
//                 pager.find('.page_link').filter(function() {
//                     return $(this).text() === String(page + 1);
//                 }).parent().addClass(settings.activeClass).removeClass('waves-effect');
//             }
//         });
//     };
// }(jQuery));

// // -----------------------------------------------------------------------------
// // AQUÍ DEBES REEMPLAZAR EL SELECTOR '#myTable tbody' y '#myPager' 
// // POR LOS IDs QUE ESTÉS USANDO REALMENTE EN TU HTML.
// // -----------------------------------------------------------------------------
// $(document).ready(function() {
//     try {
//         // Ejemplo genérico para activarlo (puedes ajustar 'perPage' según necesites)
//         // $('#idDeTuTabla tbody').pageMe({
//         //     pagerSelector: '#idDeTuPaginador',
//         //     showPrevNext: true,
//         //     hidePageNumbers: false,
//         //     perPage: 10
//         // });
//     } catch (error) {
//         console.error("Error al inicializar la paginación:", error);
//     }
// });