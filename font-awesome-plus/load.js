var head = document.getElementsByTagName('head')[0];

//Generate a style tag
var style = document.createElement('link');
style.type = 'text/css';
style.rel = "stylesheet";
style.href = '//maxcdn.bootstrapcdn.com/font-awesome/4.6.0/css/font-awesome.min.css';

//Generate fa-animation tag
var anim = document.createElement('link');
anim.type = 'text/css';
anim.rel = "stylesheet";
anim.href = '//cdnjs.cloudflare.com/ajax/libs/font-awesome-animation/0.0.8/font-awesome-animation.min.css';

head.appendChild(style);
head.appendChild(anim);
