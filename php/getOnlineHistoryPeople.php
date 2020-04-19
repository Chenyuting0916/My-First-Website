<?php
	 include('connect1.php');
	
	$ip = $_SERVER["REMOTE_ADDR"];
	date_default_timezone_set("Asia/Taipei");
	$nowdate = date("Y-m-d H:i:s");

	$sql = "SELECT * FROM people";	
	$result = mysqli_query($conn, $sql);
	
	$num = mysqli_num_rows($result);
	$num++;
	$sql = "INSERT INTO people VALUES(" . $num . ", '" . $ip . "','" . $nowDate . "', 0)";
	$conn -> query($sql);

	$conn -> close();

	$rtnData = array();
	$rtnData[0] = $num;
	$rtnData[1] = $var1;
	echo json_encode($rtnData);
?>