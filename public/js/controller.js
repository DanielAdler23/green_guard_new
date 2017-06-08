const environment = 'http://localhost:3000'
//const environment = 'https://green-guard.herokuapp.com'

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


var green = angular.module('green', ['ngCookies', 'ngFlash']);


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

                console.log(data.error)

                var id = Flash.create('info', 'HELLO', 0, {class: 'custom-class', id: 'custom-id'}, true)

                window.location = data
                console.log("Form Data Sent successfully");
            },
            error: function (error) {
                console.log(error.responseText)
                var id = Flash.create('info', error.responseText, 0, {class: 'custom-class', id: 'custom-id'}, true)
            }
        });
    }
}]);



green.controller('getCameras',['$scope','$cookies','$compile', function($scope,$cookies,$compile) {

        $scope.getUsersCameras = function(){
            var userId = $cookies.get("userId")
             $.ajax({
                 type: "GET",
                 url: `${environment}/api/users/getUsersCameras/${userId}`,
                 cache: false,
                 success: function(cameras) {
                     $scope.cameras = cameras
                     console.log(cameras)
                      $('.nav-second-level').remove('.user-camera')
                     
                      for (var camera of cameras) {
                          $('.nav-second-level').append(
							'<li class="user-camera">'
                                +'<a onclick="getCamera('+camera.id+')"><i class="fa fa-user- fa-fw"></i>'+camera.id+'</a>'+
							'</il>' )
                     }
                 }
             });
        };


        $scope.getAllCamaras = function(){
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
        $scope.getCamera = function(cameraId){
            console.log('Get Camera')
            $.ajax({
                type: "GET",
                url: `${environment}/api/cameras/getCamera/${cameraId}`,
                cache: false,
                success: function(data) {
                    console.log(data)
                    $cookies.put("cameraName", data.id)
                    $cookies.put("cameraPicture", data.picture)
                    $cookies.put("cameraData", data.toString())
                    window.location.href ="cameraPage.html"
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
                    $scope.cameras = cameras

                    for (var cam of cameras){
                        console.log('camera - ' + cam);

                        var newCamera = document.createElement('div');
                        // newCamera.id = 'newCamera';
                        newCamera.innerHTML = "<img src='"+cam.picture+"'> " +
                                              "<p>"+cam.id+"</p>"+
                                              "<button type='button' id='"+cam.id+"' onclick='toggleState("+cam.id+")'>Attach Camera </button> "
                        document.getElementById('center').appendChild(newCamera)

                    }
                }
            });
        }
}]);



green.controller('cameraPage', ['$scope', '$cookies', function($scope, $cookies) {

        $scope.initializePage = function() {
            console.log('Initialize')
            $scope.cameraName = $cookies.get("cameraName")
            $scope.cameraPicture = $cookies.get("cameraPicture")
            $scope.cameraData = $cookies.get("cameraData")
        }


        $scope.submit = function(){
            var cameraName = $cookies.get("cameraName")
            var cameraPicture = $cookies.get("cameraPicture")
            var cameraData = $cookies.get("cameraData")
            console.log(cameraName)
            console.log(cameraPicture)
            console.log(cameraData)
            // $.post("https://green-guard.herokuapp.com/api/cameras/setRule/"+camera.id, {
            //         "inOut": camera.inOut,
            //         "polygon": JSON.stringify(polygon)
            //     },
            //     function(data, status){
            //         alert("Data: " + data.message + "\nStatus: " + status);
            //     })
            //
            //
            // for(var i=0; i < polygon.length; i++)
            //     console.log("Point " + i + " - X: " + polygon[i].x + " Y: " + polygon[i].y)
        }

        $scope.startCamera = function(){
            console.log("startCamera")

            console.log(polygon)

            // $.ajax({
            //     type: "GET",
            //     url: "https://green-guard.herokuapp.com/api/cameras/startCamera/"+id,
            //     cache: false,
            //     success: function(data) {
            //         console.log(data)
            //     }
            // });
        };



}]);


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
    });
}