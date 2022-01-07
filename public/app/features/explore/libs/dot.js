/**
 * Created by Wu Jian Ping on - 2021/07/12.
 */

const Dot = (options) => {
  const defaults = { files: [], format: 'svg', engine: 'dot' };

  options = Object.assign({}, defaults, options, { TOTAL_MEMORY: 1024 * 1024 * 64 });

  const module = Viz.Module(Object.assign({}, options));

  return function dot(strings) {
    let string = strings[0] + '';
    let i = 0;
    const n = arguments.length;

    while (++i < n) {
      string += arguments[i] + '' + strings[i];
    }

    const template = document.createElement('template');
    template.innerHTML = Viz.render(module, string, options);

    return template.content.firstElementChild;
  };
}

export default Dot({})