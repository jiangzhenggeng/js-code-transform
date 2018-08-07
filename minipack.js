/* minipack.js */
const fs = require('fs')
const path = require('path')
const babylon = require('babylon')
const traverse = require('babel-traverse').default
const {transformFromAst} = require('babel-core')


let ID = 0

function createAsset(filename) {
	// 以字符串形式读取文件的内容.
	const content = fs.readFileSync(filename, 'utf-8');
// 现在我们试图找出这个文件依赖于哪个文件。虽然我们可以通过查看其内容来获取import字符串. 然而,这是一个非常笨重的方法，我们将使用JavaScript解析器来代替。

// JavaScript解析器是可以读取和理解JavaScript代码的工具，它们生成一个更抽象的模型,称为`ast (抽象语法树)(https://astexplorer.net)`。
	const ast = babylon.parse(content, {
		sourceType: 'module',
	});

// 定义数组，这个数组将保存这个模块依赖的模块的相对路径.
	const dependencies = [];

//  我们遍历`ast`来试着理解这个模块依赖哪些模块，要做到这一点,我们需要检查`ast`中的每个 `import` 声明。
// `Ecmascript`模块相当简单,因为它们是静态的. 这意味着你不能`import`一个变量,或者有条件地`import`另一个模块。每次我们看到`import`声明时,我们都可以将其数值视为`依赖性`。
	traverse(ast, {
		ImportDeclaration: ({node}) => {
			// 我们将依赖关系存入数组
			dependencies.push(node.source.value);
		}
	});


//   我们还通过递增简单计数器为此模块分配唯一标识符.
	const id = ID++;

//  我们使用`Ecmascript`模块和其他JavaScript,可能不支持所有浏览器。
//  为了确保我们的程序在所有浏览器中运行,
//  我们将使用[babel](https://babeljs.io)来进行转换。
//  我们可以用`babel-preset-env``将我们的代码转换为浏览器可以运行的东西.
	const {code} = transformFromAst(ast, null, {
		presets: ['env'],
	});

// 返回有关此模块的所有信息.
	return {
		id,
		filename,
		dependencies,
		code,
	};
}

function createGraph(entry) {
	// 首先解析整个文件.
	const mainAsset = createAsset(entry);

//   我们将使用queue来解析每个asset的依赖关系.
//   我们正在定义一个只有entry asset的数组.
	const queue = [mainAsset];

// 我们使用一个`for ... of`循环遍历 队列.
// 最初 这个队列 只有一个asset,但是当我们迭代它时,我们会将额外的assert推入到queue中.
// 这个循环将在queue为空时终止.
	for (const asset of queue) {
		// 我们的每一个asset都有它所依赖模块的相对路径列表.
		// 我们将重复它们,用我们的`createAsset() `函数解析它们,并跟踪此模块在此对象中的依赖关系.
		asset.mapping = {};

		// 这是这个模块所在的目录.
		const dirname = path.dirname(asset.filename);

		// 我们遍历其相关路径的列表
		asset.dependencies.forEach(relativePath => {
			// 我们可以通过将相对路径与父资源目录的路径连接,将相对路径转变为绝对路径.
			const absolutePath = path.join(dirname, relativePath);

			// 解析asset,读取其内容并提取其依赖关系.
			const child = createAsset(absolutePath);

			//   了解`asset`依赖取决于`child`这一点对我们来说很重要.
			//   通过给`asset.mapping`对象增加一个新的属性(值为child.id)来表达这种一一对应的关系.
			asset.mapping[relativePath] = child.id;

			// 最后,我们将`child`这个资产推入队列,这样它的依赖关系也将被迭代和解析.
			queue.push(child);
		});
	}

	return queue;
}

function bundle(graph) {
	let modules = '';

// 在我们到达该函数的主体之前,我们将构建一个作为该函数的参数的对象.
// 请注意,我们构建的这个字符串被两个花括号 ({}) 包裹,因此对于每个模块,
// 我们添加一个这种格式的字符串: `key: value,`.
	graph.forEach(mod => {
		//  图表中的每个模块在这个对象中都有一个entry. 我们用模块的id`作为`key`，用数组作为`value`
		// 第一个参数是用函数包装的每个模块的代码. 这是因为模块应该被限定范围: 在一个模块中定义变量不会影响其他模块或全局范围.

		// 对于第二个参数,我们用`stringify`解析模块及其依赖之间的关系(也就是上文的asset.mapping). 解析后的对象看起来像这样: `{'./relative/path': 1}`.

		// 这是因为我们模块的被转换后会通过相对路径来调用`require()`. 当调用这个函数时,我们应该能够知道依赖图中的哪个模块对应于该模块的相对路径.
		modules += `${mod.id}: [
      function (require, module, exports) { ${mod.code} },
      ${JSON.stringify(mod.mapping)},
    ],`;
	});

	return modules
}


const graph = createGraph('./example/entry.js');
const result = bundle(graph);
fs.writeFileSync('bundle.js', result);





