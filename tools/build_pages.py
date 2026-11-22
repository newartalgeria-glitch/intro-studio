#!/usr/bin/env python3
"""Generates the static information pages (public/*.html) in Arabic, French and English.
Run:  python3 tools/build_pages.py   -- then commit the generated files."""
import os, html

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public')
SITE = 'https://newartalgeria-glitch.github.io/intro-studio/'
PUB = 'ca-pub-4523466271796141'
LANGS = ['ar', 'fr', 'en']

NAV = {
    'ar': [('./', 'الاستوديو'), ('guides/', 'الأدلة'), ('about.html', 'من نحن'), ('privacy.html', 'الخصوصية'), ('terms.html', 'الشروط'), ('contact.html', 'اتصل بنا')],
    'fr': [('./', 'Studio'), ('guides/', 'Guides'), ('about.html', 'À propos'), ('privacy.html', 'Confidentialité'), ('terms.html', 'Conditions'), ('contact.html', 'Contact')],
    'en': [('./', 'Studio'), ('guides/', 'Guides'), ('about.html', 'About'), ('privacy.html', 'Privacy'), ('terms.html', 'Terms'), ('contact.html', 'Contact')],
}
FOOT = {
    'ar': 'تتم معالجة صورك وموسيقاك داخل متصفحك فقط، ولا تُرفع إلى أي خادم',
    'fr': 'Vos photos et votre musique sont traitées dans votre navigateur et ne sont jamais envoyées à un serveur',
    'en': 'Your photos and music are processed in your browser only and never uploaded to a server',
}
OPEN = {'ar': 'افتح الاستوديو', 'fr': 'Ouvrir le studio', 'en': 'Open the studio'}

PAGES = {}  # path -> {lang: (title, description, body)}

# ---------------------------------------------------------------- about
PAGES['about.html'] = {
 'ar': ('من نحن', 'Nadir Photo Album أداة مجانية تعمل داخل المتصفح لصنع جينيريك البداية لفيديوهات الأعراس والمناسبات وتصديره بصيغة MP4.', '''
<h1>من نحن</h1>
<p class="lead">Nadir Photo Album استوديو مجاني يعمل داخل المتصفح، يحوّل صور مناسبتك إلى فيديو افتتاحي (جينيريك) جاهز للإضافة إلى فيلم العرس أو الحفل.</p>
<h2>ما الفكرة؟</h2>
<p>مصورو الأعراس وصنّاع الفيديو يحتاجون كثيرا إلى مقدمة جميلة تعرض صور العروسين أو صاحب المناسبة مع الأسماء والتاريخ والموسيقى. البرامج الاحترافية قوية لكنها ثقيلة ومعقدة، لذلك صنعنا أداة أبسط: تختار قالبا، تضيف صورك ونصوصك وموسيقاك، ثم تصدّر الفيديو.</p>
<h2>أهم ما فيه</h2>
<ul>
<li>أكثر من 170 قالبا لأنواع المناسبات: زفاف، خطوبة، مولود، تخرج، ذكريات عائلية، مناسبات رسمية وفنية، عيد ميلاد وقصة حب، إضافة إلى قوالب ألبوم كتاب ثلاثي الأبعاد تتقلب صفحاته.</li>
<li>الصور تظهر كاملة دون قص، وتتبع مدة الفيديو عدد الصور وعدد الثواني لكل صورة.</li>
<li>نصوص حرة على مسارات متعددة تحرّكها وتكبّرها على المعاينة وتحدد وقت ظهورها على خط الزمن.</li>
<li>مسار موسيقى مع قص البداية والنهاية وضبط مستوى الصوت وإنهاء تدريجي.</li>
<li>مكتبة مؤثرات (جزيئات وإطارات) وانتقالات، وخطوط عربية ولاتينية.</li>
<li>تصدير MP4 بدقة 1080p أو 720p، وحفظ المشروع لإعادة تعديله لاحقا.</li>
<li>واجهة بالعربية والفرنسية والإنجليزية، ونمط نهاري وليلي.</li>
</ul>
<h2>الخصوصية أولا</h2>
<p>كل المعالجة تحدث داخل متصفحك. صورك وموسيقاك لا تغادر جهازك. اقرأ <a href="privacy.html">سياسة الخصوصية</a> للتفاصيل.</p>
<h2>من وراء المشروع؟</h2>
<p>أنشأ المشروع نادر، مصور وفنان وكاتب سيناريو من الجزائر، بدافع حاجته إلى أداة عملية في عمله مع زملائه. المشروع تجريبي ومجاني ويتطور باستمرار بحسب ملاحظات المستخدمين. تواصل معنا عبر <a href="contact.html">صفحة الاتصال</a>.</p>
<a class="cta" href="./">جرّب الاستوديو</a>
'''),
 'fr': ('À propos', 'Nadir Photo Album est un studio gratuit, dans le navigateur, pour créer le générique d’ouverture de vos vidéos de mariage et d’événements et l’exporter en MP4.', '''
<h1>À propos</h1>
<p class="lead">Nadir Photo Album est un studio gratuit qui fonctionne dans le navigateur et transforme les photos d’un événement en vidéo d’ouverture (générique) prête à être ajoutée au film d’un mariage ou d’une cérémonie.</p>
<h2>L’idée</h2>
<p>Les photographes et vidéastes ont souvent besoin d’une belle introduction qui présente les mariés ou la personne fêtée avec les noms, la date et de la musique. Les logiciels professionnels sont puissants mais lourds et complexes. Nous avons donc créé un outil plus simple : on choisit un modèle, on ajoute ses photos, ses textes et sa musique, puis on exporte la vidéo.</p>
<h2>Points forts</h2>
<ul>
<li>Plus de 170 modèles selon l’occasion : mariage, fiançailles, naissance, remise de diplôme, souvenirs de famille, cérémonies officielles et artistiques, anniversaire, histoire d’amour, ainsi que des modèles d’album livre en 3D dont les pages se tournent.</li>
<li>Les photos s’affichent entières, sans recadrage, et la durée de la vidéo suit le nombre de photos et les secondes par photo.</li>
<li>Textes libres sur plusieurs pistes : on les déplace et on les redimensionne sur l’aperçu, et on règle leur apparition sur la frise chronologique.</li>
<li>Piste musicale avec découpe du début et de la fin, volume réglable et fondu de sortie.</li>
<li>Bibliothèque d’effets (particules, cadres) et de transitions, polices arabes et latines.</li>
<li>Export MP4 en 1080p ou 720p et sauvegarde du projet pour le modifier plus tard.</li>
<li>Interface en arabe, français et anglais, thème clair et sombre.</li>
</ul>
<h2>La confidentialité d’abord</h2>
<p>Tout le traitement se fait dans votre navigateur. Vos photos et votre musique ne quittent pas votre appareil. Lisez la <a href="privacy.html">politique de confidentialité</a>.</p>
<h2>Qui est derrière le projet ?</h2>
<p>Le projet a été créé par Nadir, photographe, artiste et scénariste en Algérie, pour répondre à un besoin concret dans son travail avec ses collègues. Il est gratuit, évolutif et s’améliore grâce aux retours des utilisateurs. Écrivez-nous via la <a href="contact.html">page Contact</a>.</p>
<a class="cta" href="./">Essayer le studio</a>
'''),
 'en': ('About', 'Nadir Photo Album is a free in-browser studio for creating opening titles for wedding and event videos and exporting them as MP4.', '''
<h1>About</h1>
<p class="lead">Nadir Photo Album is a free studio that runs in your browser and turns the photos of an event into an opening video (intro titles) ready to be added to a wedding or ceremony film.</p>
<h2>The idea</h2>
<p>Wedding photographers and video makers often need a polished opening that presents the couple or the guest of honor with names, a date and music. Professional editors are powerful but heavy and complicated, so we built a simpler tool: pick a template, add your photos, text and music, then export the video.</p>
<h2>Highlights</h2>
<ul>
<li>More than 170 templates by occasion: wedding, engagement, newborn, graduation, family memories, formal and artistic events, birthday, love story, plus 3D book-album templates whose pages turn.</li>
<li>Photos are shown whole, never cropped, and the video length follows the number of photos and the seconds per photo.</li>
<li>Free text on several tracks: move and resize it on the preview and set when it appears on the timeline.</li>
<li>A music track with start and end trimming, adjustable volume and a gradual fade-out.</li>
<li>A library of effects (particles, frames) and transitions, with Arabic and Latin fonts.</li>
<li>MP4 export at 1080p or 720p, and project saving so you can edit again later.</li>
<li>Arabic, French and English interface, light and dark themes.</li>
</ul>
<h2>Privacy first</h2>
<p>All processing happens inside your browser. Your photos and music never leave your device. Read the <a href="privacy.html">Privacy Policy</a> for details.</p>
<h2>Who is behind it?</h2>
<p>The project was created by Nadir, a photographer, artist and screenwriter from Algeria, to meet a real need in his own work with colleagues. It is free and keeps improving thanks to user feedback. Get in touch through the <a href="contact.html">Contact page</a>.</p>
<a class="cta" href="./">Try the studio</a>
'''),
}

# ---------------------------------------------------------------- contact
PAGES['contact.html'] = {
 'ar': ('اتصل بنا', 'تواصل معنا لإرسال ملاحظاتك أو الإبلاغ عن مشكلة أو اقتراح ميزة في Nadir Photo Album.', '''
<h1>اتصل بنا</h1>
<p class="lead">يسعدنا سماع ملاحظاتك واقتراحاتك.</p>
<h2>البريد الإلكتروني</h2>
<p>للاستفسارات والاقتراحات والتعاون: <bdi dir="ltr"><a class="mail" data-mail-user="newartalgeria" data-mail-domain="gmail.com" href="contact.html">newartalgeria [at] gmail [dot] com</a></bdi></p>
<h2>الإبلاغ عن مشكلة أو اقتراح ميزة</h2>
<p>الطريقة الأسرع هي فتح طلب جديد في صفحة المشروع على GitHub. اذكر نوع المتصفح ونسخته ووصفا واضحا للمشكلة، وإن أمكن عدد الصور والقالب المستعمل.</p>
<p><a class="cta" href="https://github.com/newartalgeria-glitch/intro-studio/issues" rel="noopener">فتح طلب على GitHub</a></p>
<div class="note">لأن الاستوديو يعمل بالكامل داخل متصفحك، لا نملك صورك ولا موسيقاك ولا يمكننا استرجاع مشروعك. احتفظ دائما بنسخة من ملف المشروع <bdi dir="ltr">.nadiralbum</bdi>. لتصدير الفيديو نوصي بمتصفح Chrome أو Edge حديث.</div>
'''),
 'fr': ('Contact', 'Contactez-nous pour envoyer des remarques, signaler un problème ou proposer une fonction pour Nadir Photo Album.', '''
<h1>Contact</h1>
<p class="lead">Nous serons heureux de lire vos remarques et suggestions.</p>
<h2>E-mail</h2>
<p>Pour toute question, suggestion ou collaboration : <a class="mail" data-mail-user="newartalgeria" data-mail-domain="gmail.com" href="contact.html">newartalgeria [at] gmail [dot] com</a></p>
<h2>Signaler un problème ou proposer une fonction</h2>
<p>Le plus rapide est d’ouvrir un ticket sur la page GitHub du projet. Indiquez votre navigateur et sa version, une description claire du problème et, si possible, le nombre de photos et le modèle utilisé.</p>
<p><a class="cta" href="https://github.com/newartalgeria-glitch/intro-studio/issues" rel="noopener">Ouvrir un ticket sur GitHub</a></p>
<div class="note">Comme le studio fonctionne entièrement dans votre navigateur, nous ne possédons ni vos photos, ni votre musique, et nous ne pouvons pas récupérer votre projet. Gardez toujours une copie du fichier de projet <bdi dir="ltr">.nadiralbum</bdi>. Pour exporter la vidéo, nous recommandons un Chrome ou Edge récent.</div>
'''),
 'en': ('Contact', 'Get in touch to send feedback, report a problem or suggest a feature for Nadir Photo Album.', '''
<h1>Contact</h1>
<p class="lead">We would love to hear your feedback and ideas.</p>
<h2>Email</h2>
<p>For questions, suggestions or collaboration: <a class="mail" data-mail-user="newartalgeria" data-mail-domain="gmail.com" href="contact.html">newartalgeria [at] gmail [dot] com</a></p>
<h2>Report a problem or suggest a feature</h2>
<p>The fastest way is to open a new issue on the project’s GitHub page. Please include your browser and its version, a clear description of the problem and, if possible, the number of photos and the template you used.</p>
<p><a class="cta" href="https://github.com/newartalgeria-glitch/intro-studio/issues" rel="noopener">Open an issue on GitHub</a></p>
<div class="note">Because the studio runs entirely in your browser, we do not hold your photos or music and cannot recover your project. Always keep a copy of your <bdi dir="ltr">.nadiralbum</bdi> project file. To export video we recommend a recent Chrome or Edge.</div>
'''),
}

# ---------------------------------------------------------------- privacy
PAGES['privacy.html'] = {
 'ar': ('سياسة الخصوصية', 'سياسة الخصوصية لـ Nadir Photo Album: ما الذي يحدث لصورك وموسيقاك ولبياناتك، وملفات تعريف الارتباط والإعلانات.', '''
<h1>سياسة الخصوصية</h1>
<p class="lead">آخر تحديث: 15 نوفمبر 2026</p>
<p>نحترم خصوصيتك. توضح هذه الصفحة ما الذي يحدث لبياناتك عند استخدام Nadir Photo Album.</p>
<h2>صورك وموسيقاك تبقى معك</h2>
<p>كل العمليات (عرض القوالب، إضافة الصور والنصوص والموسيقى، المعاينة، وتصدير الفيديو) تتم <strong>داخل متصفحك</strong> على جهازك. لا يملك الاستوديو خادما لاستقبال الملفات، ولا نرفع صورك أو موسيقاك أو مشاريعك ولا نخزنها ولا نطلع عليها. ملف المشروع <bdi dir="ltr">.nadiralbum</bdi> والفيديو المصدَّر يُحفظان على جهازك فقط.</p>
<h2>ما نخزنه في متصفحك</h2>
<p>قد يحفظ الموقع في التخزين المحلي للمتصفح (localStorage) تفضيلات بسيطة مثل لغة الواجهة والنمط النهاري أو الليلي وبعض إعدادات العرض. تبقى هذه القيم على جهازك ويمكنك حذفها بمسح بيانات الموقع من المتصفح.</p>
<h2>خدمات الأطراف الثالثة</h2>
<ul>
<li><strong>GitHub Pages:</strong> يُستضاف الموقع على GitHub Pages، وقد يسجل GitHub بيانات الطلبات التقنية (مثل عنوان IP) وفق <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">سياسة خصوصية GitHub</a>.</li>
<li><strong>الخطوط:</strong> خطوط الاستوديو مضمّنة في الموقع نفسه ولا تُحمَّل من خدمات خارجية.</li>
</ul>
<h2>الإعلانات</h2>
<p>قد تعرض صفحات الأدلة والمعلومات إعلانات عبر <strong>Google AdSense</strong>، ولا تظهر إعلانات داخل أداة التحرير نفسها. تستخدم Google وشركاؤها ملفات تعريف الارتباط (Cookies) لعرض إعلانات بناء على زياراتك لهذا الموقع ومواقع أخرى. يمكنك التحكم في الإعلانات المخصصة أو إيقافها من <a href="https://adssettings.google.com" rel="noopener">إعدادات إعلانات Google</a>، أو زيارة <a href="https://www.aboutads.info" rel="noopener">aboutads.info</a>. للمستخدمين في المنطقة الاقتصادية الأوروبية والمملكة المتحدة وسويسرا، نطلب موافقتك على ملفات تعريف الارتباط الإعلانية قبل تفعيلها. للمزيد عن كيفية استخدام Google للبيانات: <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com</a>.</p>
<h2>الأطفال</h2>
<p>الموقع غير موجه للأطفال دون 13 سنة، ولا نجمع عمدا أي بيانات شخصية عنهم.</p>
<h2>تغييرات السياسة</h2>
<p>قد نحدّث هذه السياسة عند إضافة ميزات جديدة، وسيظهر تاريخ آخر تحديث أعلى الصفحة.</p>
<h2>اتصل بنا</h2>
<p>لأي سؤال حول الخصوصية، راسلنا عبر <a href="contact.html">صفحة الاتصال</a>.</p>
'''),
 'fr': ('Politique de confidentialité', 'Politique de confidentialité de Nadir Photo Album : ce qu’il advient de vos photos, de votre musique et de vos données, cookies et publicité.', '''
<h1>Politique de confidentialité</h1>
<p class="lead">Dernière mise à jour : 15 novembre 2026</p>
<p>Nous respectons votre vie privée. Cette page explique ce qu’il advient de vos données lorsque vous utilisez Nadir Photo Album.</p>
<h2>Vos photos et votre musique restent chez vous</h2>
<p>Toutes les opérations (affichage des modèles, ajout de photos, de textes et de musique, aperçu et export de la vidéo) ont lieu <strong>dans votre navigateur</strong>, sur votre appareil. Le studio ne dispose d’aucun serveur pour recevoir des fichiers : nous n’envoyons, ne stockons ni ne consultons vos photos, votre musique ou vos projets. Le fichier de projet <bdi dir="ltr">.nadiralbum</bdi> et la vidéo exportée sont enregistrés uniquement sur votre appareil.</p>
<h2>Ce que nous stockons dans votre navigateur</h2>
<p>Le site peut enregistrer dans le stockage local du navigateur (localStorage) de simples préférences : langue de l’interface, thème clair ou sombre et quelques réglages d’affichage. Ces valeurs restent sur votre appareil et vous pouvez les supprimer en effaçant les données du site.</p>
<h2>Services tiers</h2>
<ul>
<li><strong>GitHub Pages :</strong> le site est hébergé sur GitHub Pages, qui peut enregistrer des données techniques de requête (comme l’adresse IP) selon la <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">politique de confidentialité de GitHub</a>.</li>
<li><strong>Polices :</strong> les polices du studio sont intégrées au site et ne sont pas chargées depuis un service externe.</li>
</ul>
<h2>Publicité</h2>
<p>Les pages de guides et d’information peuvent afficher des annonces via <strong>Google AdSense</strong> ; aucune annonce n’apparaît dans l’outil de montage lui-même. Google et ses partenaires utilisent des cookies pour diffuser des annonces fondées sur vos visites sur ce site et d’autres sites. Vous pouvez gérer ou désactiver les annonces personnalisées dans les <a href="https://adssettings.google.com" rel="noopener">paramètres des annonces Google</a> ou sur <a href="https://www.aboutads.info" rel="noopener">aboutads.info</a>. Pour les utilisateurs de l’Espace économique européen, du Royaume-Uni et de la Suisse, nous demandons votre consentement avant d’activer les cookies publicitaires. Pour en savoir plus sur l’utilisation des données par Google : <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com</a>.</p>
<h2>Enfants</h2>
<p>Le site ne s’adresse pas aux enfants de moins de 13 ans et nous ne collectons pas sciemment de données personnelles les concernant.</p>
<h2>Modifications</h2>
<p>Nous pouvons mettre à jour cette politique lors de l’ajout de nouvelles fonctions ; la date de dernière mise à jour figure en haut de la page.</p>
<h2>Contact</h2>
<p>Pour toute question sur la confidentialité, écrivez-nous via la <a href="contact.html">page Contact</a>.</p>
'''),
 'en': ('Privacy Policy', 'Privacy Policy for Nadir Photo Album: what happens to your photos, music and data, plus cookies and advertising.', '''
<h1>Privacy Policy</h1>
<p class="lead">Last updated: November 15, 2026</p>
<p>We respect your privacy. This page explains what happens to your data when you use Nadir Photo Album.</p>
<h2>Your photos and music stay with you</h2>
<p>Every operation (browsing templates, adding photos, text and music, previewing and exporting the video) happens <strong>inside your browser</strong> on your device. The studio has no server to receive files: we do not upload, store or look at your photos, music or projects. The <bdi dir="ltr">.nadiralbum</bdi> project file and the exported video are saved only on your device.</p>
<h2>What we store in your browser</h2>
<p>The site may keep simple preferences in the browser’s local storage (localStorage), such as the interface language, the light or dark theme and a few display settings. These values stay on your device and you can delete them by clearing the site’s data.</p>
<h2>Third-party services</h2>
<ul>
<li><strong>GitHub Pages:</strong> the site is hosted on GitHub Pages, which may record technical request data (such as your IP address) under the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener">GitHub Privacy Statement</a>.</li>
<li><strong>Fonts:</strong> the studio’s fonts are bundled with the site and are not loaded from an external service.</li>
</ul>
<h2>Advertising</h2>
<p>The guide and information pages may show ads through <strong>Google AdSense</strong>; no ads appear inside the editing tool itself. Google and its partners use cookies to serve ads based on your visits to this and other websites. You can manage or turn off personalized ads in <a href="https://adssettings.google.com" rel="noopener">Google Ads Settings</a> or at <a href="https://www.aboutads.info" rel="noopener">aboutads.info</a>. For users in the European Economic Area, the United Kingdom and Switzerland, we ask for your consent before advertising cookies are enabled. To learn more about how Google uses data: <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">policies.google.com</a>.</p>
<h2>Children</h2>
<p>The site is not directed at children under 13 and we do not knowingly collect personal data about them.</p>
<h2>Changes</h2>
<p>We may update this policy when new features are added; the last-updated date is shown at the top.</p>
<h2>Contact</h2>
<p>For any privacy question, write to us through the <a href="contact.html">Contact page</a>.</p>
'''),
}

# ---------------------------------------------------------------- terms
PAGES['terms.html'] = {
 'ar': ('شروط الاستخدام', 'شروط استخدام Nadir Photo Album: الاستخدام المجاني، مسؤولية المحتوى وحقوق الصور والموسيقى، وإخلاء المسؤولية.', '''
<h1>شروط الاستخدام</h1>
<p class="lead">آخر تحديث: 15 نوفمبر 2026</p>
<p>باستخدامك Nadir Photo Album فإنك توافق على الشروط التالية.</p>
<h2>الاستخدام المجاني</h2>
<p>الاستوديو مجاني للاستخدام الشخصي والمهني، بما في ذلك الفيديوهات التي تبيعها لعملائك. الفيديوهات التي تصنعها ملكك، ولا نضع عليها علامة مائية.</p>
<h2>محتواك ومسؤوليتك</h2>
<ul>
<li>أنت المسؤول عن الصور والنصوص والموسيقى التي تضيفها، وعن حصولك على حقوق استخدامها ونشرها وعلى موافقة أصحاب الصور الظاهرين فيها.</li>
<li>لا تستعمل الأداة لإنتاج محتوى مخالف للقانون أو مسيء أو ينتهك حقوق الآخرين.</li>
<li>الموسيقى المحمية بحقوق النشر قد تؤدي إلى حظر الفيديو أو إزالته على منصات مثل YouTube أو Facebook، فاستعمل موسيقى مرخصة لك.</li>
</ul>
<h2>إخلاء المسؤولية</h2>
<p>يُقدَّم الاستوديو «كما هو» دون ضمانات من أي نوع. يعتمد التصدير على إمكانات متصفحك وحاسوبك (يلزم متصفح حديث يدعم WebCodecs مثل Chrome أو Edge)، ولا نضمن أن تعمل الأداة دون انقطاع أو أخطاء. احتفظ بنسخة احتياطية من ملفاتك الأصلية ومن ملف المشروع. لا نتحمل مسؤولية أي خسارة ناتجة عن استخدام الأداة.</p>
<h2>الملكية الفكرية</h2>
<p>تصاميم القوالب والمؤثرات وشيفرة الاستوديو مملوكة لصاحب المشروع. لا يجوز إعادة بيع القوالب أو الأداة نفسها على أنها منتج مستقل دون إذن.</p>
<h2>التغييرات والتوقف</h2>
<p>قد نغيّر الاستوديو أو نضيف إليه أو نوقفه في أي وقت، وقد نعدّل هذه الشروط وسيظهر تاريخ التحديث أعلى الصفحة.</p>
<h2>اتصل بنا</h2>
<p>لأي استفسار راسلنا عبر <a href="contact.html">صفحة الاتصال</a>.</p>
'''),
 'fr': ('Conditions d’utilisation', 'Conditions d’utilisation de Nadir Photo Album : usage gratuit, responsabilité du contenu, droits sur les photos et la musique, limitation de responsabilité.', '''
<h1>Conditions d’utilisation</h1>
<p class="lead">Dernière mise à jour : 15 novembre 2026</p>
<p>En utilisant Nadir Photo Album, vous acceptez les conditions suivantes.</p>
<h2>Utilisation gratuite</h2>
<p>Le studio est gratuit pour un usage personnel et professionnel, y compris pour les vidéos que vous livrez à vos clients. Les vidéos que vous créez vous appartiennent et nous n’y ajoutons aucun filigrane.</p>
<h2>Votre contenu, votre responsabilité</h2>
<ul>
<li>Vous êtes responsable des photos, textes et musiques que vous ajoutez, de vos droits pour les utiliser et les diffuser et de l’accord des personnes qui apparaissent sur les photos.</li>
<li>N’utilisez pas l’outil pour produire un contenu illégal, injurieux ou portant atteinte aux droits d’autrui.</li>
<li>Une musique protégée par le droit d’auteur peut entraîner le blocage ou le retrait de la vidéo sur des plateformes comme YouTube ou Facebook : utilisez une musique dont vous avez la licence.</li>
</ul>
<h2>Limitation de responsabilité</h2>
<p>Le studio est fourni « tel quel », sans garantie d’aucune sorte. L’export dépend des capacités de votre navigateur et de votre ordinateur (un navigateur récent prenant en charge WebCodecs, comme Chrome ou Edge, est nécessaire) et nous ne garantissons pas un fonctionnement sans interruption ni erreur. Conservez une copie de vos fichiers d’origine et de votre fichier de projet. Nous déclinons toute responsabilité pour une perte liée à l’usage de l’outil.</p>
<h2>Propriété intellectuelle</h2>
<p>Les modèles, effets et le code du studio appartiennent à l’auteur du projet. Il est interdit de revendre les modèles ou l’outil lui-même comme un produit distinct sans autorisation.</p>
<h2>Modifications et arrêt</h2>
<p>Nous pouvons modifier, enrichir ou arrêter le studio à tout moment et modifier ces conditions ; la date de mise à jour figure en haut de la page.</p>
<h2>Contact</h2>
<p>Pour toute question, écrivez-nous via la <a href="contact.html">page Contact</a>.</p>
'''),
 'en': ('Terms of Use', 'Terms of Use for Nadir Photo Album: free use, content responsibility, rights to photos and music, and disclaimer.', '''
<h1>Terms of Use</h1>
<p class="lead">Last updated: November 15, 2026</p>
<p>By using Nadir Photo Album you agree to the following terms.</p>
<h2>Free use</h2>
<p>The studio is free for personal and professional use, including videos you deliver to your clients. The videos you make belong to you and we add no watermark.</p>
<h2>Your content, your responsibility</h2>
<ul>
<li>You are responsible for the photos, text and music you add, for having the right to use and publish them and for the consent of the people shown in the photos.</li>
<li>Do not use the tool to produce unlawful or abusive content or content that infringes the rights of others.</li>
<li>Copyrighted music can lead to a video being blocked or removed on platforms such as YouTube or Facebook, so use music you are licensed to use.</li>
</ul>
<h2>Disclaimer</h2>
<p>The studio is provided “as is” without warranties of any kind. Exporting depends on the capabilities of your browser and computer (a recent browser that supports WebCodecs, such as Chrome or Edge, is required) and we do not guarantee uninterrupted or error-free operation. Keep a backup of your original files and of your project file. We accept no liability for any loss resulting from use of the tool.</p>
<h2>Intellectual property</h2>
<p>The template designs, effects and studio code belong to the project’s author. You may not resell the templates or the tool itself as a separate product without permission.</p>
<h2>Changes and discontinuation</h2>
<p>We may change, extend or discontinue the studio at any time and may revise these terms; the update date is shown at the top.</p>
<h2>Contact</h2>
<p>For any question, write to us through the <a href="contact.html">Contact page</a>.</p>
'''),
}

# ---------------------------------------------------------------- guides
G = {}
G['make-wedding-intro-video.html'] = {
 'ar': ('كيف تصنع فيديو افتتاحي لعرس خطوة بخطوة', 'شرح عملي لصنع جينيريك بداية لفيديو عرس أو مناسبة: اختيار القالب والصور والنصوص والموسيقى ثم تصدير MP4.', 'اختيار القالب، إضافة الصور، النصوص، الموسيقى، التصدير.', '''
<h1>كيف تصنع فيديو افتتاحي لعرس خطوة بخطوة</h1>
<p class="lead">في أقل من نصف ساعة يمكنك تحويل صور العرس إلى مقدمة فيديو جاهزة. هذا الشرح يمر على الخطوات بالترتيب.</p>
<h2>1. اختر القالب المناسب</h2>
<p>افتح تبويب «القوالب» وحدد نوع المناسبة (زفاف، خطوبة، تخرج…). عند اختيار قالب تظهر نتيجته مباشرة في المعاينة. القوالب التي في الفئة «ألبوم كتاب 3D» تعرض صورك على صفحات كتاب يفتح غلافه وتتقلب صفحاته، وبقية الفئات تعرض الصور بحركات كاميرا وخلفيات مختلفة.</p>
<h2>2. أضف الصور</h2>
<p>من تبويب «الصور» اسحب صورك أو اختَرها (حتى 40 صورة). تُعرض كل صورة كاملة دون قص. حدد عدد الثواني لكل صورة، فتتبع مدة الفيديو عدد الصور مضروبا في هذه المدة. للتحكم في صورة واحدة انقر عليها في خط الزمن بالزر الأيمن وغيّر مدتها.</p>
<h2>3. أضف النصوص</h2>
<p>انقر على تبويب «نص» واكتب الاسم أو العنوان ثم «موافق». يظهر النص على مسار خاص أسفل مسار الصور، ويمكنك سحبه في المعاينة وتكبيره من أركانه الأربعة. أضف عدة نصوص لتظهر معا، وغيّر الخط واللون من اللوحة. اسحب المقطع على خط الزمن لتحدد لحظة ظهوره، واسحب حافته لتغيير مدته.</p>
<h2>4. أضف الموسيقى</h2>
<p>من تبويب «موسيقى» اختر ملف mp3 أو wav. اقصّ بدايته ونهايته بسحب حافتي المقطع أو بزر المقص، وارفع الصوت أو اخفضه بالخط الأحمر في وسط المقطع، وحرّك النقطة في آخر الخط لإنهاء الموسيقى تدريجيا.</p>
<h2>5. أضف مؤثرات وانتقالات (اختياري)</h2>
<p>تبويب «مؤثرات» يضيف جزيئات أو إطارات يمكنك التحكم في حجمها وكميتها. استعمل ذلك بقدر، فالمقدمة الأنيقة أفضل من المزدحمة.</p>
<h2>6. احفظ المشروع وصدّر الفيديو</h2>
<p>اضغط «حفظ على الحاسوب» لتحصل على ملف <bdi dir="ltr">.nadiralbum</bdi> تفتحه لاحقا لمواصلة التعديل. ثم اضغط «تصدير فيديو MP4» واختر مكان الحفظ. اترك التبويب مفتوحا ولا تُدخل الحاسوب في وضع السكون حتى ينتهي التصدير، فمدته تقارب مدة الفيديو أو أكثر بحسب قوة جهازك.</p>
<div class="note">نصيحة: جرّب أولا بعدد قليل من الصور لتتأكد من الشكل، ثم أضف بقية الصور.</div>
<a class="cta" href="../">افتح الاستوديو</a>
'''),
 'fr': ('Créer l’ouverture d’une vidéo de mariage pas à pas', 'Guide pratique pour créer le générique d’un film de mariage ou d’événement : modèle, photos, textes, musique, export MP4.', 'Modèle, photos, textes, musique, export.', '''
<h1>Créer l’ouverture d’une vidéo de mariage pas à pas</h1>
<p class="lead">En moins d’une demi-heure, vous pouvez transformer les photos d’un mariage en introduction vidéo prête à l’emploi. Voici les étapes dans l’ordre.</p>
<h2>1. Choisir le modèle</h2>
<p>Ouvrez l’onglet « Modèles » et sélectionnez l’occasion (mariage, fiançailles, diplôme…). Le résultat s’affiche aussitôt dans l’aperçu. Les modèles de la catégorie « Album livre 3D » présentent vos photos sur les pages d’un livre dont la couverture s’ouvre et dont les pages se tournent ; les autres catégories utilisent des mouvements de caméra et des fonds variés.</p>
<h2>2. Ajouter les photos</h2>
<p>Dans l’onglet « Photos », glissez ou choisissez vos images (jusqu’à 40). Chaque photo est affichée entière, sans recadrage. Réglez le nombre de secondes par photo : la durée de la vidéo suit le nombre de photos multiplié par cette durée. Pour une photo précise, faites un clic droit sur elle dans la frise et changez sa durée.</p>
<h2>3. Ajouter les textes</h2>
<p>Cliquez sur l’onglet « Texte », saisissez le nom ou le titre puis « OK ». Le texte apparaît sur une piste dédiée sous la piste des photos ; déplacez-le dans l’aperçu et redimensionnez-le avec les quatre coins. Ajoutez plusieurs textes pour qu’ils s’affichent ensemble et changez la police et la couleur dans le panneau. Faites glisser le clip sur la frise pour fixer son apparition et tirez son bord pour changer sa durée.</p>
<h2>4. Ajouter la musique</h2>
<p>Dans l’onglet « Musique », choisissez un fichier mp3 ou wav. Découpez son début et sa fin en tirant les bords du clip ou avec le bouton ciseaux, réglez le volume avec la ligne rouge au milieu du clip et déplacez le point à la fin de la ligne pour terminer la musique en fondu.</p>
<h2>5. Effets et transitions (facultatif)</h2>
<p>L’onglet « Effets » ajoute des particules ou des cadres dont vous réglez la taille et la quantité. Restez mesuré : une introduction élégante vaut mieux qu’une introduction chargée.</p>
<h2>6. Sauvegarder et exporter</h2>
<p>Cliquez sur « Enregistrer sur l’ordinateur » pour obtenir un fichier <bdi dir="ltr">.nadiralbum</bdi> que vous rouvrirez plus tard. Cliquez ensuite sur « Exporter la vidéo MP4 » et choisissez l’emplacement. Laissez l’onglet ouvert et ne mettez pas l’ordinateur en veille avant la fin : l’export dure à peu près la durée de la vidéo, voire plus selon la puissance de votre machine.</p>
<div class="note">Conseil : testez d’abord avec peu de photos pour valider le rendu, puis ajoutez le reste.</div>
<a class="cta" href="../">Ouvrir le studio</a>
'''),
 'en': ('How to make a wedding intro video, step by step', 'A practical walkthrough for creating opening titles for a wedding or event video: template, photos, text, music and MP4 export.', 'Template, photos, text, music, export.', '''
<h1>How to make a wedding intro video, step by step</h1>
<p class="lead">In under half an hour you can turn wedding photos into a ready-to-use video opening. Here are the steps in order.</p>
<h2>1. Pick a template</h2>
<p>Open the “Templates” tab and choose the occasion (wedding, engagement, graduation…). The result shows instantly in the preview. Templates in the “3D book album” category show your photos on the pages of a book whose cover opens and whose pages turn; the other categories use camera moves and different backgrounds.</p>
<h2>2. Add photos</h2>
<p>In the “Photos” tab drag in or choose your images (up to 40). Each photo is shown whole, without cropping. Set the seconds per photo: the video length follows the number of photos times that duration. For one specific photo, right-click it on the timeline and change its duration.</p>
<h2>3. Add text</h2>
<p>Click the “Text” tab, type the name or title and press “OK”. The text lands on its own track below the photo track; drag it on the preview and resize it with its four corners. Add several texts to show them together and change the font and colour in the panel. Drag the clip on the timeline to set when it appears and pull its edge to change its length.</p>
<h2>4. Add music</h2>
<p>In the “Music” tab choose an mp3 or wav file. Trim its start and end by dragging the clip edges or with the scissors button, raise or lower the volume with the red line through the middle of the clip, and move the dot at the end of the line to fade the music out gradually.</p>
<h2>5. Effects and transitions (optional)</h2>
<p>The “Effects” tab adds particles or frames whose size and amount you control. Keep it measured: an elegant opening beats a crowded one.</p>
<h2>6. Save and export</h2>
<p>Click “Save to computer” to get a <bdi dir="ltr">.nadiralbum</bdi> file you can reopen later. Then click “Export MP4 video” and choose where to save it. Keep the tab open and do not let the computer sleep until it finishes: export takes about as long as the video, or longer on a slower machine.</p>
<div class="note">Tip: try a few photos first to check the look, then add the rest.</div>
<a class="cta" href="../">Open the studio</a>
'''),
}

G['wedding-intro-structure-and-timing.html'] = {
 'ar': ('كيف تبني مقدمة فيديو عرس: عدد الصور والتوقيت والنصوص', 'نصائح لتنظيم مقدمة فيديو العرس أو الحفل: عدد الصور المناسب، مدة كل صورة، متى تظهر النصوص وكيف تنسجم مع الموسيقى.', 'عدد الصور، المدة، ترتيب النصوص، الانسجام مع الموسيقى.', '''
<h1>كيف تبني مقدمة فيديو عرس: عدد الصور والتوقيت والنصوص</h1>
<p class="lead">المقدمة الجيدة قصيرة بما يكفي لتبقي المشاهد متحمسا، وغنية بما يكفي لتعطي انطباعا أنيقا. إليك قواعد عملية.</p>
<h2>كم صورة تحتاج؟</h2>
<p>ليس هناك رقم واحد صحيح، لكن هذه تقديرات مفيدة. مقدمة قصيرة لفيلم طويل: من 8 إلى 15 صورة بين 3 و5 ثوان للصورة، أي نحو دقيقة. فيديو ذكريات أو ألبوم كامل: 30 إلى 40 صورة بمدة 4 إلى 6 ثوان، أي بين دقيقتين وأربع دقائق. في قوالب «ألبوم كتاب» كل مشهد يعرض 4 صور (صفحتان بصورتين لكل صفحة)، فالصور الكثيرة تعني عددا أكبر من تقليب الصفحات.</p>
<h2>مدة الصورة</h2>
<ul>
<li>من 3 إلى 4 ثوان للصور البسيطة ذات الوجه الواحد.</li>
<li>من 5 إلى 6 ثوان للقوالب ذات الحركة البطيئة أو الصور الجماعية التي يحتاج المشاهد إلى وقت ليقرأها.</li>
<li>تجنب أقل من ثانيتين: لا تُرى الصورة جيدا.</li>
</ul>
<h2>ترتيب الصور</h2>
<p>ابدأ بأجمل صورة للعروسين، ثم صور العائلة، ثم اللحظات العفوية، وانهِ بصورة قوية تتحمل التوقف عندها. اجمع الصور المتشابهة بالإضاءة معا لتبدو الانتقالات سلسة.</p>
<h2>النصوص</h2>
<ul>
<li>اجعل الاسمين وعنوان المناسبة أول ما يظهر، ثم التاريخ والمكان لاحقا.</li>
<li>اترك كل نص على الشاشة 4 إلى 5 ثوان على الأقل ليُقرأ براحة.</li>
<li>اختر خطا واحدا أو اثنين فقط وحافظ على لون يتباين مع الخلفية. الظل الخفيف المضاف تلقائيا يساعد على القراءة.</li>
<li>لا تضع نصا فوق وجوه الأشخاص، حرّكه إلى جهة فارغة من الصورة.</li>
</ul>
<h2>الانسجام مع الموسيقى</h2>
<p>اختر موسيقى مناسبة لإيقاع القالب: هادئة للصور البطيئة، أسرع للقوالب ذات الحركة. اجعل نهاية الموسيقى تتناغم مع نهاية الفيديو باستعمال زر «ملاءمة مدة الفيديو» ثم إنهاء الصوت تدريجيا.</p>
<a class="cta" href="../">جرّب ذلك في الاستوديو</a>
'''),
 'fr': ('Structurer l’intro d’un film de mariage : nombre de photos, durée et textes', 'Conseils pour organiser l’introduction d’un film de mariage ou de cérémonie : nombre de photos, durée de chaque photo, textes et accord avec la musique.', 'Nombre de photos, durée, textes, musique.', '''
<h1>Structurer l’intro d’un film de mariage : nombre de photos, durée et textes</h1>
<p class="lead">Une bonne introduction est assez courte pour garder l’attention et assez riche pour donner une impression élégante. Voici des repères pratiques.</p>
<h2>De combien de photos avez-vous besoin ?</h2>
<p>Il n’y a pas de chiffre unique, mais voici des ordres de grandeur. Intro courte pour un long film : 8 à 15 photos de 3 à 5 secondes chacune, soit environ une minute. Vidéo souvenir ou album complet : 30 à 40 photos de 4 à 6 secondes, soit entre deux et quatre minutes. Dans les modèles « Album livre », chaque scène affiche 4 photos (deux pages de deux photos) : plus de photos signifie donc plus de pages tournées.</p>
<h2>Durée d’une photo</h2>
<ul>
<li>3 à 4 secondes pour les photos simples avec un seul visage.</li>
<li>5 à 6 secondes pour les modèles au mouvement lent ou les photos de groupe qu’il faut le temps de lire.</li>
<li>Évitez moins de deux secondes : la photo n’est pas vraiment vue.</li>
</ul>
<h2>Ordre des photos</h2>
<p>Commencez par la plus belle photo des mariés, puis la famille, puis les moments spontanés, et terminez par une image forte sur laquelle on peut s’arrêter. Regroupez les photos de lumière semblable pour que les transitions paraissent fluides.</p>
<h2>Textes</h2>
<ul>
<li>Faites apparaître d’abord les deux prénoms et le titre de l’événement, puis la date et le lieu.</li>
<li>Laissez chaque texte à l’écran au moins 4 à 5 secondes pour qu’il soit lu sans effort.</li>
<li>Limitez-vous à une ou deux polices et à une couleur qui contraste avec le fond. L’ombre légère ajoutée automatiquement aide à la lecture.</li>
<li>Ne placez pas de texte sur les visages : déplacez-le vers une zone libre de l’image.</li>
</ul>
<h2>Accord avec la musique</h2>
<p>Choisissez une musique adaptée au rythme du modèle : calme pour les images lentes, plus vive pour les modèles dynamiques. Faites coïncider la fin de la musique avec celle de la vidéo grâce au bouton « Ajuster à la durée de la vidéo », puis terminez par un fondu.</p>
<a class="cta" href="../">Essayer dans le studio</a>
'''),
 'en': ('Structuring a wedding video intro: photo count, timing and text', 'Tips for organizing the opening of a wedding or ceremony film: how many photos, how long each lasts, when text appears and how to match the music.', 'Photo count, timing, text order, music.', '''
<h1>Structuring a wedding video intro: photo count, timing and text</h1>
<p class="lead">A good intro is short enough to keep viewers excited and rich enough to feel elegant. Here are practical rules of thumb.</p>
<h2>How many photos do you need?</h2>
<p>There is no single right number, but these are useful ballparks. A short intro for a long film: 8 to 15 photos at 3 to 5 seconds each, about a minute. A memories video or full album: 30 to 40 photos at 4 to 6 seconds, between two and four minutes. In the “book album” templates every scene shows 4 photos (two pages with two photos each), so more photos simply means more page turns.</p>
<h2>How long each photo stays</h2>
<ul>
<li>3 to 4 seconds for simple single-face photos.</li>
<li>5 to 6 seconds for slow-moving templates or group photos that take time to read.</li>
<li>Avoid under two seconds: the photo is hardly seen.</li>
</ul>
<h2>Photo order</h2>
<p>Start with the best photo of the couple, then family, then candid moments, and end on a strong image that can hold the screen. Group photos with similar lighting so transitions feel smooth.</p>
<h2>Text</h2>
<ul>
<li>Show the two names and the event title first, then the date and place later.</li>
<li>Keep each text on screen at least 4 to 5 seconds so it can be read comfortably.</li>
<li>Stick to one or two fonts and a colour that contrasts with the background. The light shadow added automatically helps readability.</li>
<li>Do not put text over faces; move it to an empty area of the picture.</li>
</ul>
<h2>Matching the music</h2>
<p>Choose music that suits the template’s pace: calm for slow images, livelier for dynamic templates. Make the music end with the video using the “Fit to video length” button, then finish with a gradual fade-out.</p>
<a class="cta" href="../">Try it in the studio</a>
'''),
}

G['prepare-photos-for-1080p-video.html'] = {
 'ar': ('تجهيز الصور لفيديو بدقة 1080p', 'كيف تجهز صور العرس لفيديو Full HD: الأبعاد ونسبة العرض إلى الارتفاع وحجم الملفات والصور العمودية والدقة.', 'الأبعاد، النسبة 16:9، الصور العمودية، حجم الملفات.', '''
<h1>تجهيز الصور لفيديو بدقة 1080p</h1>
<p class="lead">فيديو Full HD بدقة 1080p أبعاده 1920×1080 بكسل ونسبته 16:9. فيما يلي ما يهم صورك كي تبدو حادة وكاملة.</p>
<h2>الأبعاد الكافية</h2>
<p>يكفي أن يكون عرض الصورة الأفقية 1920 بكسل فأكثر، وارتفاع الصورة العمودية 1080 فأكثر. صور الكاميرات والهواتف الحديثة أكبر بكثير من ذلك، فلا حاجة لتصغيرها. لا تستعمل صورا صغيرة جدا (أقل من 800 بكسل) فتبدو ضبابية عند تكبيرها.</p>
<h2>الصور العمودية والأفقية</h2>
<p>شاشة الفيديو أفقية، والاستوديو يعرض كل صورة كاملة دون قص. لذلك الصورة العمودية تظهر بكامل إطارها في الوسط وخلفها نسخة مموهة من الصورة نفسها تملأ الباقي، كما أن قوالب الكتاب تضع الصور داخل صفحاتها بالنسبة الأصلية. لا حاجة إذن لقص صورك قبل إضافتها.</p>
<h2>اتجاه الصورة</h2>
<p>إذا ظهرت صورة مقلوبة أو مائلة 90 درجة، فقد تكون معلومات الاتجاه (EXIF) مفقودة. أدرها في برنامج الصور ثم احفظها وأضفها من جديد.</p>
<h2>الحجم والصيغة</h2>
<ul>
<li>الصيغ المناسبة: JPEG وPNG وWebP.</li>
<li>يمكن إضافة حتى 40 صورة. إن كان حاسوبك محدود الذاكرة فصغّر الصور الضخمة (أكثر من 20 ميغابكسل) قبل إضافتها.</li>
<li>تجنب الصور المضغوطة بشدة التي أُرسلت عبر تطبيقات المراسلة، فقد فقدت جزءا من جودتها.</li>
</ul>
<h2>اللون والإضاءة</h2>
<p>وحّد تدريجات الألوان بقدر ما تستطيع: صور بإضاءة ودرجة حرارة لونية متقاربة تبدو أجمل في المقدمة من خليط متنافر. عدّل الصور الأصلية في برنامجك المفضل قبل إدخالها.</p>
<h2>اختيار 720p أم 1080p عند التصدير</h2>
<p>1080p هو الخيار الأنسب للأفلام والعرض على التلفاز. اختر 720p إذا كان الحاسوب بطيئا أو أردت ملفا أصغر وتصديرا أسرع.</p>
<a class="cta" href="../">افتح الاستوديو</a>
'''),
 'fr': ('Préparer ses photos pour une vidéo en 1080p', 'Comment préparer des photos de mariage pour une vidéo Full HD : dimensions, format 16:9, photos verticales, poids des fichiers et résolution.', 'Dimensions, format 16:9, photos verticales, poids des fichiers.', '''
<h1>Préparer ses photos pour une vidéo en 1080p</h1>
<p class="lead">Une vidéo Full HD en 1080p mesure 1920×1080 pixels, au format 16:9. Voici ce qui compte pour que vos photos restent nettes et entières.</p>
<h2>Des dimensions suffisantes</h2>
<p>Il suffit qu’une photo horizontale mesure au moins 1920 pixels de large et qu’une photo verticale fasse au moins 1080 pixels de haut. Les appareils photo et téléphones récents dépassent largement ces valeurs : inutile de les réduire. Évitez les images très petites (moins de 800 pixels) qui paraissent floues une fois agrandies.</p>
<h2>Photos verticales et horizontales</h2>
<p>L’écran vidéo est horizontal et le studio affiche chaque photo entière, sans recadrage. Une photo verticale apparaît donc avec son cadre complet au centre, sur une version floutée de la même image qui remplit le reste ; les modèles « livre » placent les photos dans leurs pages en gardant les proportions d’origine. Inutile donc de recadrer vos images avant de les ajouter.</p>
<h2>Orientation</h2>
<p>Si une photo apparaît à l’envers ou tournée de 90°, ses informations d’orientation (EXIF) sont peut-être absentes. Pivotez-la dans votre logiciel photo, enregistrez-la et ajoutez-la de nouveau.</p>
<h2>Poids et format</h2>
<ul>
<li>Formats adaptés : JPEG, PNG et WebP.</li>
<li>Vous pouvez ajouter jusqu’à 40 photos. Si votre ordinateur manque de mémoire, réduisez les très grandes images (plus de 20 mégapixels) avant de les ajouter.</li>
<li>Évitez les images très compressées reçues via des messageries : elles ont déjà perdu en qualité.</li>
</ul>
<h2>Couleur et lumière</h2>
<p>Harmonisez autant que possible les tons : des photos à la lumière et à la température de couleur proches sont plus belles dans une introduction qu’un mélange disparate. Retouchez les originaux dans votre logiciel habituel avant de les importer.</p>
<h2>720p ou 1080p à l’export ?</h2>
<p>Le 1080p convient le mieux aux films et à l’affichage sur téléviseur. Choisissez le 720p si votre ordinateur est lent ou si vous voulez un fichier plus léger et un export plus rapide.</p>
<a class="cta" href="../">Ouvrir le studio</a>
'''),
 'en': ('Preparing your photos for a 1080p video', 'How to prepare wedding photos for a Full HD video: dimensions, 16:9 aspect ratio, portrait photos, file size and resolution.', 'Dimensions, 16:9, portrait photos, file size.', '''
<h1>Preparing your photos for a 1080p video</h1>
<p class="lead">A Full HD 1080p video is 1920×1080 pixels with a 16:9 aspect ratio. Here is what matters so your photos stay sharp and whole.</p>
<h2>Enough pixels</h2>
<p>A landscape photo should be at least 1920 pixels wide and a portrait photo at least 1080 pixels tall. Modern cameras and phones far exceed that, so there is no need to shrink them. Avoid very small images (under 800 pixels), which look blurry once enlarged.</p>
<h2>Portrait and landscape photos</h2>
<p>The video frame is landscape and the studio shows every photo whole, with no cropping. A portrait photo therefore appears with its full frame in the centre over a blurred copy of the same picture that fills the rest, and the book templates place photos on their pages at the original proportions. There is no need to crop your images before adding them.</p>
<h2>Orientation</h2>
<p>If a photo shows upside down or turned by 90°, its orientation data (EXIF) may be missing. Rotate it in your photo software, save it and add it again.</p>
<h2>Size and format</h2>
<ul>
<li>Suitable formats: JPEG, PNG and WebP.</li>
<li>You can add up to 40 photos. If your computer is short on memory, shrink very large images (over 20 megapixels) before adding them.</li>
<li>Avoid heavily compressed images received through messaging apps; they have already lost quality.</li>
</ul>
<h2>Colour and light</h2>
<p>Keep colour grading consistent where you can: photos with similar lighting and colour temperature look better in an intro than a jumbled mix. Edit the originals in your usual software before importing them.</p>
<h2>720p or 1080p when exporting?</h2>
<p>1080p suits films and TV playback best. Choose 720p if your computer is slow or you want a smaller file and a faster export.</p>
<a class="cta" href="../">Open the studio</a>
'''),
}

G['music-for-event-videos.html'] = {
 'ar': ('الموسيقى في فيديوهات المناسبات: الحقوق ونصائح الاختيار', 'ما تحتاج معرفته عن حقوق الموسيقى في فيديوهات الأعراس والمناسبات، وكيف تختار الأغنية المناسبة وتقصّها وتنهيها تدريجيا.', 'حقوق الموسيقى، اختيار الأغنية، القص والإنهاء التدريجي.', '''
<h1>الموسيقى في فيديوهات المناسبات: الحقوق ونصائح الاختيار</h1>
<p class="lead">الموسيقى تصنع نصف أثر المقدمة. لكن اختيار أغنية دون التفكير في حقوقها قد يعرّض فيديو العرس للحظر. هذه معلومات عامة وليست استشارة قانونية.</p>
<h2>هل يمكنني استعمال أي أغنية؟</h2>
<p>معظم الأغاني الحديثة محمية بحقوق النشر. تسليم الفيديو لعميل بشكل خاص أمر، ونشره على منصات مثل YouTube أو Facebook أمر آخر: هذه المنصات تفحص الصوت آليا وقد تحظر الفيديو في بعض البلدان أو تحذف صوته أو تضع عليه إعلانات لصالح أصحاب الحقوق. تختلف القوانين من بلد لآخر، فتأكد من وضعك قبل نشر عمل تجاري.</p>
<h2>بدائل آمنة</h2>
<ul>
<li>موسيقى مرخصة بالاستخدام التجاري من مكتبات موسيقى معروفة، مع الاحتفاظ بإثبات الترخيص.</li>
<li>موسيقى بترخيص Creative Commons مع احترام شروطها (مثل ذكر اسم الفنان).</li>
<li>موسيقى ألّفها صديق أو فنان تعاقدت معه كتابيا.</li>
<li>موسيقى مسجلة يملك العميل رخصتها، على مسؤوليته.</li>
</ul>
<h2>اختيار الأغنية</h2>
<p>فضّل مقطعا هادئا ذا بداية واضحة، وتجنب كلمات قد لا تناسب جمهور الحفل. استمع إلى المقطع مع الصور لتتأكد من أن الإيقاع يناسب سرعة تقليب الصور.</p>
<h2>القص والإنهاء داخل الاستوديو</h2>
<ol>
<li>أضف الملف من تبويب «موسيقى».</li>
<li>اسحب حافتي المقطع لقص مقدمة طويلة أو نهاية لا تريدها، أو ضع المؤشر عند اللحظة المطلوبة واضغط زر المقص.</li>
<li>اضغط «ملاءمة مدة الفيديو» لتغطي الموسيقى الفيديو كله.</li>
<li>اخفض مستوى الصوت أو ارفعه بالخط الأحمر في وسط المقطع، وحرّك النقطة في آخره ليتلاشى الصوت بدل أن ينقطع.</li>
</ol>
<div class="note">الصوت المصدَّر يدخل ضمن ملف MP4 نفسه. يتم الخلط داخل متصفحك دون رفع الموسيقى إلى أي مكان.</div>
<a class="cta" href="../">افتح الاستوديو</a>
'''),
 'fr': ('La musique dans les vidéos d’événements : droits et conseils', 'Ce qu’il faut savoir sur les droits musicaux dans les vidéos de mariage et d’événements, et comment choisir, couper et terminer un morceau en fondu.', 'Droits musicaux, choix du morceau, découpe et fondu.', '''
<h1>La musique dans les vidéos d’événements : droits et conseils</h1>
<p class="lead">La musique fait la moitié de l’effet d’une introduction. Mais choisir un morceau sans penser à ses droits peut valoir à une vidéo de mariage d’être bloquée. Ces informations sont générales et ne constituent pas un avis juridique.</p>
<h2>Puis-je utiliser n’importe quelle chanson ?</h2>
<p>La plupart des chansons récentes sont protégées par le droit d’auteur. Livrer une vidéo à un client en privé n’est pas la même chose que la publier sur YouTube ou Facebook : ces plateformes analysent automatiquement le son et peuvent bloquer la vidéo dans certains pays, en couper le son ou y placer des publicités au profit des ayants droit. Les lois varient selon les pays : vérifiez votre situation avant de publier un travail commercial.</p>
<h2>Des solutions plus sûres</h2>
<ul>
<li>Musique licenciée pour un usage commercial, issue de bibliothèques musicales reconnues, avec conservation de la preuve de licence.</li>
<li>Musique sous licence Creative Commons, en respectant ses conditions (par exemple la mention de l’artiste).</li>
<li>Musique composée par un ami ou un artiste avec qui vous avez un accord écrit.</li>
<li>Musique enregistrée dont le client détient la licence, sous sa responsabilité.</li>
</ul>
<h2>Choisir le morceau</h2>
<p>Préférez un passage calme au début bien marqué et évitez des paroles qui pourraient ne pas convenir au public de la fête. Écoutez le morceau avec les photos pour vérifier que le rythme correspond à la vitesse des pages ou des images.</p>
<h2>Découper et terminer dans le studio</h2>
<ol>
<li>Ajoutez le fichier depuis l’onglet « Musique ».</li>
<li>Tirez les bords du clip pour couper une longue intro ou une fin indésirable, ou placez le curseur à l’instant voulu et cliquez sur les ciseaux.</li>
<li>Cliquez sur « Ajuster à la durée de la vidéo » pour que la musique couvre toute la vidéo.</li>
<li>Baissez ou montez le volume avec la ligne rouge au milieu du clip et déplacez le point à son extrémité pour que le son s’estompe au lieu de s’arrêter net.</li>
</ol>
<div class="note">Le son exporté est intégré au fichier MP4. Le mixage se fait dans votre navigateur, sans envoyer la musique où que ce soit.</div>
<a class="cta" href="../">Ouvrir le studio</a>
'''),
 'en': ('Music in event videos: rights and tips', 'What to know about music rights in wedding and event videos, and how to choose, trim and fade out a track.', 'Music rights, choosing a track, trimming and fading.', '''
<h1>Music in event videos: rights and tips</h1>
<p class="lead">Music makes half the impact of an intro. But picking a song without thinking about its rights can get a wedding video blocked. This is general information, not legal advice.</p>
<h2>Can I use any song?</h2>
<p>Most recent songs are protected by copyright. Handing a video to a client privately is one thing; publishing it on YouTube or Facebook is another: those platforms scan audio automatically and may block the video in some countries, mute it or run ads on it for the rights holders. Laws differ by country, so check your situation before publishing commercial work.</p>
<h2>Safer options</h2>
<ul>
<li>Music licensed for commercial use from reputable music libraries, keeping proof of the licence.</li>
<li>Creative Commons music, following its terms (for example crediting the artist).</li>
<li>Music composed by a friend or an artist you have a written agreement with.</li>
<li>Recorded music the client holds the licence for, at the client’s responsibility.</li>
</ul>
<h2>Choosing the track</h2>
<p>Prefer a calm passage with a clear beginning and avoid lyrics that may not suit the party’s audience. Listen with the photos to check the rhythm matches the pace of the page turns or images.</p>
<h2>Trimming and fading inside the studio</h2>
<ol>
<li>Add the file from the “Music” tab.</li>
<li>Drag the clip edges to cut a long intro or an unwanted ending, or put the playhead at the right moment and press the scissors.</li>
<li>Press “Fit to video length” so the music covers the whole video.</li>
<li>Lower or raise the volume with the red line through the middle of the clip and move the dot at its end so the sound fades out instead of cutting off.</li>
</ol>
<div class="note">The exported sound is built into the MP4 file. Mixing happens in your browser, without sending the music anywhere.</div>
<a class="cta" href="../">Open the studio</a>
'''),
}

GUIDE_ORDER = ['make-wedding-intro-video.html', 'wedding-intro-structure-and-timing.html', 'prepare-photos-for-1080p-video.html', 'music-for-event-videos.html']
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from guides_more import GM, EXTRA
for _slug, _per in EXTRA.items():
    for _l in LANGS:
        _t, _d, _s, _b = G[_slug][_l]
        _i = _b.rfind('<a class="cta"')
        G[_slug][_l] = (_t, _d, _s, _b[:_i] + _per[_l] + '\n' + _b[_i:])
G.update(GM)
GUIDE_ORDER += list(GM)
GUIDES_TITLE = {'ar': ('أدلة صناعة فيديو المناسبات', 'شروحات عملية لصناعة مقدمة فيديو أنيقة للأعراس والمناسبات.'),
                'fr': ('Guides pour vos vidéos d’événements', 'Des explications pratiques pour créer une belle introduction pour vos mariages et événements.'),
                'en': ('Event video guides', 'Practical tutorials for creating an elegant opening for weddings and events.')}

def esc(s):
    return html.escape(s, quote=True)

def page(path, content, depth, is_guide):
    """content: {lang: (title, description, body)}"""
    up = '../' * depth
    base = path
    t_attr = ' '.join(f'data-title-{l}="{esc(content[l][0])} | Nadir Photo Album"' for l in LANGS)
    desc_attr = ' '.join(f'data-desc-{l}="{esc(content[l][1])}"' for l in LANGS)
    nav = {l: ''.join(f'<a href="{up}{h}">{n}</a>' for h, n in NAV[l]) for l in LANGS}
    # nav entries: first is ./ -> up + './' fine; guides/ -> up + 'guides/'
    header_nav = ''.join(f'<nav data-lang="{l}"{"" if l == "ar" else " hidden"}>{nav[l]}</nav>' for l in LANGS)
    footer_nav = ''.join(f'<nav data-lang="{l}"{"" if l == "ar" else " hidden"}>{nav[l]}</nav>' for l in LANGS)
    foot_txt = ''.join(f'<span data-lang="{l}"{"" if l == "ar" else " hidden"}>{FOOT[l]}</span>' for l in LANGS)
    arts = ''
    for l in LANGS:
        arts += f'<article data-lang="{l}"{"" if l == "ar" else " hidden"} lang="{l}" dir="{"rtl" if l == "ar" else "ltr"}">{content[l][2].replace("href=\"../\"", f"href=\"{up or "./"}\"")}\n{adslot() if is_guide else ""}</article>\n'
    return f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title {t_attr}>{esc(content['ar'][0])} | Nadir Photo Album</title>
<meta name="description" content="{esc(content['ar'][1])}" {desc_attr}>
<meta name="theme-color" content="#3a2a1d">
<meta name="google-adsense-account" content="{PUB}">
<meta property="og:site_name" content="Nadir Photo Album">
<meta property="og:type" content="article">
<meta property="og:title" content="{esc(content['en'][0])} | Nadir Photo Album">
<meta property="og:description" content="{esc(content['en'][1])}">
<meta property="og:url" content="{SITE}{base}">
<link rel="canonical" href="{SITE}{base}">
<link rel="icon" href="{up}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{up}site.css">
<script src="{up}ads-config.js"></script>
<script src="{up}site.js" defer></script>
</head>
<body class="{'guide' if is_guide else ''}">
<header class="top">
<a class="brand" href="{up or './'}">Nadir <span>Photo Album</span></a>
{header_nav}
<select id="lang-sel" aria-label="Language"><option value="ar">العربية</option><option value="fr">Français</option><option value="en">English</option></select>
</header>
<main>
{arts}</main>
<footer class="site">
{footer_nav}
<div>&copy; 2026 Nadir Photo Album &middot; {foot_txt}</div>
</footer>
</body>
</html>
'''

def adslot():
    return '<div class="adwrap" aria-label="Advertisement"><ins class="adsbygoogle" style="display:block" data-ad-client="' + PUB + '" data-ad-format="auto" data-full-width-responsive="true"></ins></div>'

def guides_index():
    out = {}
    for l in LANGS:
        cards = ''
        for g in GUIDE_ORDER:
            t, d, short, body = G[g][l]
            cards += f'<a class="card" href="{g}"><strong>{esc(t)}</strong><span>{esc(d)}</span></a>\n'
        body = f'<h1>{esc(GUIDES_TITLE[l][0])}</h1>\n<p class="lead">{esc(GUIDES_TITLE[l][1])}</p>\n<div class="cards">\n{cards}</div>\n<a class="cta" href="../">{OPEN[l]}</a>\n'
        out[l] = (GUIDES_TITLE[l][0], GUIDES_TITLE[l][1], body)
    return out

def main():
    for path, content in PAGES.items():
        with open(os.path.join(ROOT, path), 'w', encoding='utf-8') as f:
            f.write(page(path, content, 0, False))
    os.makedirs(os.path.join(ROOT, 'guides'), exist_ok=True)
    gi = guides_index()
    with open(os.path.join(ROOT, 'guides', 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page('guides/', gi, 1, False))
    for g in GUIDE_ORDER:
        c = {l: (G[g][l][0], G[g][l][1], G[g][l][3]) for l in LANGS}
        with open(os.path.join(ROOT, 'guides', g), 'w', encoding='utf-8') as f:
            f.write(page('guides/' + g, c, 1, True))
    urls = [SITE, SITE + 'guides/'] + [SITE + 'guides/' + g for g in GUIDE_ORDER] + [SITE + p for p in PAGES]
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '</urlset>\n')
    print('pages:', len(PAGES) + 1 + len(GUIDE_ORDER))

main()
