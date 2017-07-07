
const environment = 'http://localhost:3000'
//const environment = 'https://green-guard.herokuapp.com'
var init = true
var polygon = []
var canvas = document.getElementById('canvas')
var ctx
var img

if (location.href.split("/").slice(-1) == "cameraPage.html"){
    window.onload = () => {
        ctx = canvas.getContext('2d')
        img=document.getElementById("myImage")
        ctx.drawImage(img,0 ,0)
    }


    // Push point to polygon array
    canvas.addEventListener('click', function(event) {
        var x = parseInt(event.clientX - 288)
        var y = parseInt(event.clientY - 140)
        console.log("x - " + x + "\n")
        console.log("y - " + y + "\n")
        polygon.push({"x": x, "y": y})

        // Line & circle color and width
        ctx.strokeStyle = '#00CC99'
        ctx.lineWidth = 3
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.fillStyle = 'blue'

        // Clears polygons's closing line
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img,0 ,0)


        for(var i=0 ; i< polygon.length; i++) {
            if(i == 0) {
                ctx.beginPath()
                ctx.moveTo(polygon[i].x, polygon[i].y)
                ctx.arc(polygon[i].x, polygon[i].y, 2, 0, 2 * Math.PI)
                ctx.stroke()
            } else {
                // Draw circle on click area
                ctx.beginPath()
                ctx.moveTo(polygon[i].x, polygon[i].y)
                ctx.arc(polygon[i].x, polygon[i].y, 2, 0, 2 * Math.PI)
                ctx.stroke()

                // Draw line from last point to current point
                ctx.beginPath()
                ctx.moveTo(polygon[i-1].x, polygon[i-1].y)
                ctx.lineTo(polygon[i].x, polygon[i].y)
                ctx.stroke()
            }
        }

        // Close polygon
        ctx.beginPath()
        ctx.moveTo(polygon[polygon.length-1].x, polygon[polygon.length-1].y)
        ctx.lineTo(polygon[0].x, polygon[0].y)
        ctx.stroke()
    })

    //
    // function printPolygon() {
    //
    //     $.post("http://localhost:3000/api/cameras/setRule/fa249a21b85c46c8aeef59a46ab2a182", {
    //             "inOut": 0,
    //             "polygon": JSON.stringify(polygon)
    //         },
    //         function(data, status){
    //             alert("Data: " + data.message + "\nStatus: " + status);
    //         })
    //
    //
    //     for(var i=0; i < polygon.length; i++)
    //         console.log("Point " + i + " - X: " + polygon[i].x + " Y: " + polygon[i].y)
    // }

}


var green = angular.module('green', ['ngCookies', 'ngFlash', 'ngMaterial']);


green.controller('userCtrl', ['$scope', '$cookies', 'Flash', function($scope, $cookies, Flash) {

    $scope.submit = function (user) {
        console.log('Adding new user');
        $.ajax({
            type: "POST",
            url: `${environment}/api/users/addNewUser`,
            data: user,
            cache: false,
            success: function () {
                console.log("Form Data Sent successfully");
                window.location.href = "index.html"
            }
        });
    };

    $scope.login = function (user) {
        console.log('Login');
        $.ajax({
            type: "POST",
            url: `${environment}/api/users/login`,
            data: user,
            cache: false,
            success: function (data) {
                console.log(data)
                console.log(data.redirect)
                $cookies.put("userId", data.userId)
                $cookies.put("cameras", JSON.stringify(data.cameras))
                var id = Flash.create('info', 'HELLO', 0, {class: 'custom-class', id: 'custom-id'}, true)
                console.log("Form Data Sent successfully");

                window.location.href = data.redirect
            },
            error: function (error) {
                console.log(error.responseText)
                var id = Flash.create('info', error.responseText, 0, {class: 'custom-class', id: 'custom-id'}, true)
            }
        });
    }
}]);



green.controller('getCameras',['$scope','$cookies','$compile', function($scope,$cookies,$compile) {

    $scope.getUsersCameras = function () {
        window.location.href ="cameras.html"
    }
    $scope.getAllcameras = function(){
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getAll`,
            cache: false,
            success: function(cameras) {
                $scope.cameras = cameras

                $('.nav-second-level').remove('.user-camera')

                for (var camera of cameras) {
                    $('.nav-second-level').append(
                        '<li class="user-camera">'
                        +'<a ng-click="getCamera('+camera.id+')"><i class="fa fa-user- fa-fw"></i>'+camera.id+'</a>'+
                        '</il>' )
                }
            }
        });
    };

    $scope.attachNewCamera = function(){
        const userId = $cookies.get("userId")
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getFreeCameras`,
            cache: false,
            success: function(cameras) {
                console.log(cameras);
                for (var cam of cameras){
                    var gallery = document.createElement('div')
                    gallery.id = "galery"
                    gallery.style.float = "left"
                    gallery.style.padding = "3px 6px"
                    gallery.style.margin = "0px 3px 3px"
                    gallery.style.border = "1px solid #ccc"

                    gallery.innerHTML = "<p> <b>camera number:</b> "+cam.id+"</p>"+
                        "<img display='block' width='300' height='200' src='"+cam.picture+"'> " +
                        "<button display='block' type='button' id='"+cam.id+"' ng-click='toggleState("+cam.id+")'>Attach Camera </button> "
                    document.getElementById('center').appendChild(gallery)

                }
                $compile(gallery)($scope);
                $scope.$digest();
            }
        });
    }
   }]);


green.controller('cameras', ['$scope', '$cookies', '$compile', function($scope, $cookies, $compile) {

    $scope.open = function() {
        $scope.showModal = true;
    };

    $scope.ok = function() {
        $scope.showModal = false;
    };

    $scope.cancel = function() {
        $scope.showModal = false;
    };


    $scope.initUserCameras = function () {
        var userId = $cookies.get("userId")
        $.ajax({
            type: "GET",
            url: `${environment}/api/users/getUsersCameras/${userId}`,
            cache: false,
            success: function(cameras) {
                console.log(cameras)
                for (var camera of cameras) {
                console.log(camera.id)
                    $('table').append(
                        '<tr>' +
                        '<td id="checkbox"><input type="checkbox"></td>' +
                        '<td id="icon"><i class="fa fa-video-camera fa-fw"></i></td>' +
                        '<td id="cameraName"></td>' +
                        '<td id="cameraId">' + camera.id + '</td>' +
                        '<td id="rename"><input></td>' +
                        '<td id="define area"><button id=' + camera.id + ' ng-click="defineArea('+camera.id+')">set area</button></td>' +
                        '<td id="LifePicture"><button ng-click="getLifePicture('+camera.id+')">Get Picture</button></td>'+
                        '<td id="status"><button ng-click="startCamera('+camera.id+')">Active</button></td>' +
                        '<td id="save" style="padding-left: 20px;"><button>save</button></td>' +
                        '</tr>'
                    )}
                var table = document.querySelector('#table')
                $compile(table)($scope)
                // $scope.$digest()

            }
        })

    }

    $scope.addCamera = function () {
        console.log($scope.add)
        const userId = $cookies.get("userId")

        console.log(userId)
        $.ajax({
            type: "post",
            url: `${environment}/api/users/attachCameraToUser/${userId}`,
            cache: false,
            data:{"cameraId": $scope.add},
            success: function(data) {
                console.log(data.value.id)
                $('table').append(
                    '<tr>' +
                    '<td id="checkbox"><input type="checkbox"></td>' +
                    '<td id="icon"><i class="fa fa-video-camera fa-fw"></i></td>' +
                    '<td id="cameraName"></td>' +
                    '<td id="cameraId">' + data.value.id + '</td>' +
                    '<td id="rename"><input></td>' +
                    '<td id="define area"><button id=' + data.value.id + ' ng-click="defineArea('+data.value.id+')">set area</button></td>' +
                    '<td id="status"><button ng-click="startCamera()">Active</button></td>' +
                    '<td id="save"><button>save</button></td>' +
                    '</tr>'
                )
                var table = document.querySelector('#table')
                $compile(table)($scope)
            }
        });
    }

    $scope.defineArea = function (cameraId) {
        console.log('Get Camera')
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getCamera/${cameraId}`,
            cache: false,
            success: function(data) {
                console.log(data)
                $cookies.put("cameraId", data.id)
                $cookies.put("cameraPicture", data.picture)
                $cookies.put("cameraIp", data.ip)
                $cookies.put("cameraPort", data.port)
                // if(data.name)
                //     $cookies.put("cameraName", data.name)
                var cameraName = $cookies.get("cameraName")
                window.location.href ="cameraPage.html"
            }
        });
    }
    $scope.getLifePicture = function (cameraId) {
        console.log(cameraId)
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getPicture/${cameraId}`,
            cache: false,
            success: function(data) {
                console.log(data)
                $cookies.put("cameraId", data.id)
                $cookies.put("cameraPicture", data.picture)
                $cookies.put("cameraIp", data.ip)
                $cookies.put("cameraPort", data.port)
                // if(data.name)
                //     $cookies.put("cameraName", data.name)
                var cameraName = $cookies.get("cameraName")
                window.location.href ="cameraPage.html"
            }
        });
    }


    $scope.startCamera = function(cameraId){
        // var cameraId = $cookies.get("cameraId")
        console.log(`Start Camera - ${cameraId}`)

        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/startCamera/${cameraId}`,
            cache: false,
            success: function(data) {
                console.log(data)
            },
            error: function(err) {
                console.log(err)
            }
        })
    }
}]);

green.controller('cameraPage', ['$scope', '$cookies', '$compile', function($scope, $cookies, $compile) {

    $scope.initializePage = function() {
        console.log('Initialize')
        var userId = $cookies.get("userId")
        var cameraId = $cookies.get("cameraId")
        var cameraPicture = $cookies.get("cameraPicture")
        var cameraName = $cookies.get("cameraName")
        var cameraData = $cookies.get("cameraData")

        if(cameraName)
            $scope.cameraTitle = cameraName
        else
            $scope.cameraTitle = cameraId

        $('#myImage').attr("src", cameraPicture)

    }

    $scope.getCamera = function(cameraId){
        console.log('Get Camera')
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getCamera/${cameraId}`,
            cache: false,
            success: function(data) {
                console.log(data)
                $cookies.put("cameraId", data.id)
                $cookies.put("cameraPicture", data.picture)
                $cookies.put("cameraIp", data.ip)
                $cookies.put("cameraPort", data.port)


                if(data.name)
                    $cookies.put("cameraName", data.name)
                else
                    $cookies.remove("cameraName")
                window.location.href ="cameraPage.html"
            }
        })
    }

    $scope.setRule = function(){
        var cameraId = $cookies.get("cameraId")
        var cameraPicture = $cookies.get("cameraPicture")
        console.log($scope.inOut)
        console.log(polygon)

        $.post(`${environment}/api/cameras/setRule/${cameraId}`, {
                "inOut": $scope.inOut,
                "polygon": polygon
            },
            function(data, status){
                if(status == 200){
                    window.location.href ="cameras.html"
                }
                if(status == 400)
                alert("Data: " + data.message + "\nStatus: " + status);
            })


        for(var i=0; i < polygon.length; i++)
            console.log("Point " + i + " - X: " + polygon[i].x + " Y: " + polygon[i].y)
    }

}])



green.controller('notifications', function($scope, $cookies, $compile, $mdDialog) {

    $scope.getUsersNotifications = function() {
        console.log('Getting users notifications')
        var userId = $cookies.get("userId")

        $.ajax({
            type: "GET",
            url: `${environment}/api/users/getUsersAlerts/${userId}`,
            cache: false,
            success: function(data) {
                for (var alert of data) {
                    var date = new Date(parseInt(alert.timestamp) * 1000).toISOString().replace(/T|Z|.000/gi, " ")
                    $('table').append(
                        '<tr>' +
                        `<td id="cameraId">${alert.cameraId}</td>` +
                        `<td id="alertTime">${date}</td>` +
                        '<td><button class="btn" id="start" data-ng-click="createCarousel()">Start</button></td>' +
                        '</tr>'
                    )
                }
                var table = document.querySelector('#table')
                $compile(table)($scope)
            }
        })
    }


    $scope.createCarousel = function(ev) {
        $mdDialog.show(
            $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title('This is an alert title')
                .textContent('You can specify some description text in here.')
                .ariaLabel('Alert Dialog Demo')
                .ok('Got it!')
                .targetEvent(ev)
        );
    }
// <div id="myCarousel" class="carousel slide" data-ride="carousel">
//         <!-- Indicators -->
//         <ol class="carousel-indicators">
//         <li data-target="#myCarousel" data-slide-to="0" class="active"></li>
//         <li data-target="#myCarousel" data-slide-to="1"></li>
//         <li data-target="#myCarousel" data-slide-to="2"></li>
//         </ol>
//
//         <!-- Wrapper for slides -->
//                          <div class="carousel-inner">
//         <div class="item active">
//         <img src="la.jpg" alt="Los Angeles">
//         </div>
//
//         <div class="item">
//         <img src="chicago.jpg" alt="Chicago">
//         </div>
//
//         <div class="item">
//         <img src="ny.jpg" alt="New York">
//         </div>
//         </div>
//
//         <!-- Left and right controls -->
//     <a class="left carousel-control" href="#myCarousel" data-slide="prev">
//         <span class="glyphicon glyphicon-chevron-left"></span>
//         <span class="sr-only">Previous</span>
//         </a>
//         <a class="right carousel-control" href="#myCarousel" data-slide="next">
//         <span class="glyphicon glyphicon-chevron-right"></span>
//         <span class="sr-only">Next</span>
//         </a>
//         </div>



    $scope.getCamera = function(cameraId){
        console.log('Get Camera')
        $.ajax({
            type: "GET",
            url: `${environment}/api/cameras/getCamera/${cameraId}`,
            cache: false,
            success: function(data) {
                console.log(data)
                $cookies.put("cameraId", data.id)
                $cookies.put("cameraPicture", data.picture)
                $cookies.put("cameraIp", data.ip)
                $cookies.put("cameraPort", data.port)

                if(data.name)
                    $cookies.put("cameraName", data.name)
                else
                    $cookies.remove("cameraName")

                window.location.href ="cameraPage.html"
            }
        })
    }
})


function toggleState (cameraId) {

    var userId = decodeURIComponent(document.cookie).slice(8)
    var userId = userId.slice(0,-1)
    console.log(userId)
    console.log(cameraId)
    $.ajax({
        type: "post",
        url: `${environment}/api/users/attachCameraToUser/${userId}`,
        cache: false,
        data:{"cameraId": cameraId},
        success: function(data) {
            alert(data)
            console.log(data)
        }
    })
}


