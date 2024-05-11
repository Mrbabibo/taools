// 注释拼音
var { pinyin } = pinyinPro;

function isChinese(str) {
    var reg = /^[\u4e00-\u9fa5]+$/;
    return reg.test(str);
}
function html(currentValue) {
    let tagsArray = [];
    for (const c of currentValue) {
        const safeC = c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        if (isChinese(c)) {
            const pinyinText = pinyin(c);
            tagsArray.push(`<ruby onclick="hanziWriter('${c}')">${safeC}<rt>${pinyinText}</rt></ruby>`);
        } else if (c === '\n' || c === '\r' || c === '\t' || c === ' ' || c === '\n\r') {
            tagsArray.push(' ');
        } else {
            tagsArray.push(safeC);
        }
    }

    return tagsArray.join('');
}
// 汉字笔画

function hanziWriter(text) {
    document.getElementById('character-target').innerHTML = '';
    const writer = HanziWriter.create('character-target', text, {
        width: 200,
        height: 200,
        showCharacter: false, // 隐藏初始字符，仅显示动画
        strokeColor: '#000',
        radicalColor: '#f00', // 如果支持部首着色
        showOutline: true,
    });
    // writer.setCharacter(character)
    // writer.animateCharacter(); // 开始播放笔画动画
    writer.quiz({
        onMistake: function (strokeData) {
            console.log('Oh no! you made a mistake on stroke ' + strokeData.strokeNum);
            console.log("You've made " + strokeData.mistakesOnStroke + ' mistakes on this stroke so far');
            console.log("You've made " + strokeData.totalMistakes + ' total mistakes on this quiz');
            console.log('There are ' + strokeData.strokesRemaining + ' strokes remaining in this character');
        },
        onCorrectStroke: function (strokeData) {
            console.log('Yes!!! You got stroke ' + strokeData.strokeNum + ' correct!');
            console.log('You made ' + strokeData.mistakesOnStroke + ' mistakes on this stroke');
            console.log("You've made " + strokeData.totalMistakes + ' total mistakes on this quiz');
            console.log('There are ' + strokeData.strokesRemaining + ' strokes remaining in this character');
        },
        onComplete: function (summaryData) {
            console.log('You did it! You finished drawing ' + summaryData.character);
            console.log('You made ' + summaryData.totalMistakes + ' total mistakes on this quiz');
        },
    });
}

function handleInputChange(event) {
    // const inputElement = event.target;
    const currentValue = document.querySelector('#textarea').value;
    document.querySelector('#content').innerHTML = html(currentValue);

    // 在这里处理输入值的变化逻辑
}
function cls() {
    document.querySelector('#textarea').value = '';
    document.querySelector('#content').innerHTML = '';
    document.getElementById('character-target').innerHTML = '';
}
